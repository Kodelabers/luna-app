import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import { NotFoundError } from "@/lib/errors";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TZ = "Europe/Zagreb";

export type VacationExportData = {
  departmentName: string;
  year: number;
  employees: Array<{
    fullName: string;          // "PREZIME IME"
    totalDays: number;         // UK stupac (ALLOCATION + TRANSFER)
    canPlanVacation: boolean;  // ima li ALLOCATION entry
    months: Array<{            // index 0-11
      periods: Array<{
        start: string;         // DD.MM.YY
        end: string;           // DD.MM.YY
        days: number;          // radni dani u segmentu
      }>;
    }>;
  }>;
};

/**
 * Fetch all data needed to render the vacation export table for a department and year.
 * Uses DaySchedule as source of truth (matches the planning table).
 */
export async function getVacationExportData(
  ctx: TenantContext,
  departmentId: string,
  year: number
): Promise<VacationExportData> {
  // 1. Department
  const department = await db.department.findFirst({
    where: { id: departmentId, organisationId: ctx.organisationId, active: true },
  });

  if (!department) throw new NotFoundError("Odjel nije pronađen");

  // 2. UnavailabilityReason for godišnji odmor (hasPlanning=true, sickLeave=false)
  const reason = await db.unavailabilityReason.findFirst({
    where: {
      organisationId: ctx.organisationId,
      hasPlanning: true,
      sickLeave: false,
      active: true,
    },
  });

  if (!reason) {
    return { departmentName: department.name, year, employees: [] };
  }

  // 3. Active employees in department, sorted by lastName
  const employees = await db.employee.findMany({
    where: { departmentId, organisationId: ctx.organisationId, active: true },
    orderBy: { lastName: "asc" },
  });

  if (employees.length === 0) {
    return { departmentName: department.name, year, employees: [] };
  }

  const employeeIds = employees.map((e) => e.id);

  // Year boundaries in UTC (wall-clock Zagreb → UTC)
  const yearStartUTC = fromZonedTime(new Date(year, 0, 1, 0, 0, 0, 0), TZ);
  const yearEndUTC = fromZonedTime(new Date(year, 11, 31, 23, 59, 59, 999), TZ);

  // 4. Bulk fetch DaySchedule records for vacation reason within the year
  //    DaySchedule is the source of truth — matches the planning table exactly.
  //    Each (org, employee, date) has at most one record (unique constraint).
  const daySchedules = await db.daySchedule.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: { in: employeeIds },
      unavailabilityReasonId: reason.id,
      active: true,
      date: { gte: yearStartUTC, lte: yearEndUTC },
    },
    orderBy: { date: "asc" },
  });

  // 5. Bulk fetch ledger entries (ALLOCATION + TRANSFER) for UK column
  const ledgerEntries = await db.unavailabilityLedgerEntry.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: { in: employeeIds },
      unavailabilityReasonId: reason.id,
      year,
      type: { in: ["ALLOCATION", "TRANSFER"] },
    },
  });

  // Build per-employee maps from ledger entries
  const totalDaysMap = new Map<string, number>();
  const hasAllocationMap = new Map<string, boolean>();
  for (const entry of ledgerEntries) {
    totalDaysMap.set(entry.employeeId, (totalDaysMap.get(entry.employeeId) ?? 0) + entry.changeDays);
    if (entry.type === "ALLOCATION") {
      hasAllocationMap.set(entry.employeeId, true);
    }
  }

  // Group DaySchedule records by employeeId → month
  type DayRecord = (typeof daySchedules)[number];
  const schedulesByEmpMonth = new Map<string, Map<number, DayRecord[]>>();

  for (const ds of daySchedules) {
    const local = toZonedTime(ds.date, TZ);
    const monthIndex = local.getMonth();
    const empId = ds.employeeId;

    if (!schedulesByEmpMonth.has(empId)) schedulesByEmpMonth.set(empId, new Map());
    const monthMap = schedulesByEmpMonth.get(empId)!;
    if (!monthMap.has(monthIndex)) monthMap.set(monthIndex, []);
    monthMap.get(monthIndex)!.push(ds);
  }

  // 6. Build employee data
  const employeeData = employees.map((emp) => {
    const totalDays = totalDaysMap.get(emp.id) ?? 0;
    const canPlanVacation = hasAllocationMap.get(emp.id) ?? false;
    const monthMap = schedulesByEmpMonth.get(emp.id);

    const months = Array.from({ length: 12 }, (_, monthIndex) => {
      const records = monthMap?.get(monthIndex) ?? [];
      // records are sorted by date (from DB orderBy)

      const periods: Array<{ start: string; end: string; days: number }> = [];
      if (records.length === 0) return { periods };

      // Aggregate consecutive dates into periods
      let periodStart = toZonedTime(records[0].date, TZ);
      let periodEnd = periodStart;
      let workdays = (!records[0].isWeekend && !records[0].isHoliday) ? 1 : 0;

      for (let i = 1; i < records.length; i++) {
        const curLocal = toZonedTime(records[i].date, TZ);
        const prevLocal = toZonedTime(records[i - 1].date, TZ);

        // Compare calendar dates (ignoring time, safe against DST)
        const prevCal = new Date(prevLocal.getFullYear(), prevLocal.getMonth(), prevLocal.getDate());
        const curCal = new Date(curLocal.getFullYear(), curLocal.getMonth(), curLocal.getDate());
        const diffDays = (curCal.getTime() - prevCal.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          // Consecutive — extend current period
          periodEnd = curLocal;
          if (!records[i].isWeekend && !records[i].isHoliday) workdays++;
        } else {
          // Gap — close current period and start new one
          if (workdays > 0) {
            periods.push({
              start: format(periodStart, "dd.MM.yy"),
              end: format(periodEnd, "dd.MM.yy"),
              days: workdays,
            });
          }
          periodStart = curLocal;
          periodEnd = curLocal;
          workdays = (!records[i].isWeekend && !records[i].isHoliday) ? 1 : 0;
        }
      }

      // Close last period
      if (workdays > 0) {
        periods.push({
          start: format(periodStart, "dd.MM.yy"),
          end: format(periodEnd, "dd.MM.yy"),
          days: workdays,
        });
      }

      return { periods };
    });

    return {
      fullName: `${emp.lastName.toUpperCase()} ${emp.firstName.toUpperCase()}`,
      totalDays,
      canPlanVacation,
      months,
    };
  });

  return {
    departmentName: department.name,
    year,
    employees: employeeData,
  };
}
