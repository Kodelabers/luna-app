import { db } from "@/lib/db";
import { TenantContext, getManagerStatus } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { ApplicationStatus, EmployeeStatus } from "@prisma/client";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { parseISO, format, eachDayOfInterval, getDay } from "date-fns";

/**
 * Planning employee model (UC-PLAN-01)
 */
export type PlanningEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: number;
  departmentName: string;
};

/**
 * Planning day model (UC-PLAN-01)
 */
export type PlanningDay = {
  dateLocalISO: string; // YYYY-MM-DD u client TZ
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
};

/**
 * Planning cell model (UC-PLAN-01)
 */
export type PlanningCell = {
  employeeId: number;
  dateLocalISO: string;
  // Plan (DaySchedule) - pozadina
  daySchedule: {
    status: EmployeeStatus;
    unavailabilityReasonId: number | null;
    unavailabilityReasonName: string | null;
    unavailabilityReasonColor: string | null;
    applicationId: number | null;
  } | null;
  // Overlay (Application) - zahtjevi
  applications: Array<{
    id: number;
    status: ApplicationStatus;
    unavailabilityReasonId: number;
    unavailabilityReasonName: string;
    unavailabilityReasonColor: string | null;
    startDateLocalISO: string;
    endDateLocalISO: string;
  }>;
};

/**
 * Planning data model (UC-PLAN-01)
 */
export type PlanningData = {
  employees: PlanningEmployee[];
  days: PlanningDay[];
  cells: PlanningCell[];
};

/**
 * Input for getPlanningData
 */
export type GetPlanningDataInput = {
  fromLocalISO: string; // YYYY-MM-DD
  toLocalISO: string; // YYYY-MM-DD
  clientTimeZone: string; // IANA tz
  departmentId?: number;
};

/**
 * Get planning data for DM/GM (UC-PLAN-01)
 * Returns gantt-like data structure with employees, days, and cells
 */
export async function getPlanningData(
  ctx: TenantContext,
  input: GetPlanningDataInput
): Promise<PlanningData> {
  const { fromLocalISO, toLocalISO, clientTimeZone, departmentId } = input;

  // 1. Check manager access
  const managerStatus = await getManagerStatus(ctx);
  if (!managerStatus.isGeneralManager && !managerStatus.isDepartmentManager) {
    throw new ForbiddenError("Nemate manager pristup za prikaz planiranja");
  }

  // 2. Determine department scope
  let departmentScope: number[] = [];
  if (managerStatus.isGeneralManager) {
    // GM: all departments or selected departmentId
    if (departmentId) {
      // Verify department belongs to organisation
      const dept = await db.department.findFirst({
        where: {
          id: departmentId,
          organisationId: ctx.organisationId,
          active: true,
        },
      });
      if (!dept) {
        throw new ForbiddenError("Odjel nije pronađen ili nije u vašoj organizaciji");
      }
      departmentScope = [departmentId];
    } else {
      // All departments - fetch all active departments
      const allDepts = await db.department.findMany({
        where: {
          organisationId: ctx.organisationId,
          active: true,
        },
        select: { id: true },
      });
      departmentScope = allDepts.map((d) => d.id);
    }
  } else {
    // DM: only managed departments or selected departmentId within managed
    if (departmentId) {
      if (!managerStatus.managedDepartmentIds.includes(departmentId)) {
        throw new ForbiddenError("Nemate pristup ovom odjelu");
      }
      departmentScope = [departmentId];
    } else {
      departmentScope = managerStatus.managedDepartmentIds;
    }
  }

  if (departmentScope.length === 0) {
    // No departments to show
    return {
      employees: [],
      days: [],
      cells: [],
    };
  }

  // 3. Convert local dates to UTC bounds for DB queries
  const fromLocal = parseISO(fromLocalISO);
  const toLocal = parseISO(toLocalISO);
  
  // Set to start of day (00:00:00) and end of day (23:59:59.999)
  const fromLocalStart = new Date(fromLocal.getFullYear(), fromLocal.getMonth(), fromLocal.getDate(), 0, 0, 0, 0);
  const toLocalEnd = new Date(toLocal.getFullYear(), toLocal.getMonth(), toLocal.getDate(), 23, 59, 59, 999);
  
  const utcStart = fromZonedTime(fromLocalStart, clientTimeZone);
  const utcEnd = fromZonedTime(toLocalEnd, clientTimeZone);

  // 4. Fetch employees in scope (active=true)
  const employees = await db.employee.findMany({
    where: {
      organisationId: ctx.organisationId,
      departmentId: { in: departmentScope },
      active: true,
    },
    include: {
      department: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { department: { name: "asc" } },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  const employeeIds = employees.map((e) => e.id);

  if (employeeIds.length === 0) {
    return {
      employees: [],
      days: [],
      cells: [],
    };
  }

  // 5. Fetch DaySchedule records for employees in range
  const daySchedules = await db.daySchedule.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: { in: employeeIds },
      date: {
        gte: utcStart,
        lte: utcEnd,
      },
      active: true,
    },
    include: {
      unavailabilityReason: {
        select: {
          name: true,
          colorCode: true,
        },
      },
    },
  });

  // 6. Fetch Applications in relevant statuses for range
  const applications = await db.application.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: { in: employeeIds },
      status: {
        in: ["SUBMITTED", "APPROVED_FIRST_LEVEL", "APPROVED"],
      },
      active: true,
      // Overlap check: startDate <= utcEnd AND endDate >= utcStart
      AND: [
        { startDate: { lte: utcEnd } },
        { endDate: { gte: utcStart } },
      ],
    },
    include: {
      unavailabilityReason: {
        select: {
          name: true,
          colorCode: true,
        },
      },
    },
  });

  // 7. Fetch holidays for the organisation
  const holidays = await db.holiday.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      OR: [
        // One-time holidays in the range
        {
          repeatYearly: false,
          date: {
            gte: utcStart,
            lte: utcEnd,
          },
        },
        // Yearly holidays (we'll filter by date in code)
        {
          repeatYearly: true,
        },
      ],
    },
  });

  // 8. Build holiday map by local date (YYYY-MM-DD)
  const holidayMap = new Map<string, string>();
  for (const holiday of holidays) {
    const holidayLocalDate = toZonedTime(holiday.date, clientTimeZone);
    const dateKey = format(holidayLocalDate, "yyyy-MM-dd");
    
    if (holiday.repeatYearly) {
      // For yearly holidays, check if they fall in the requested range
      const holidayMonth = holidayLocalDate.getMonth();
      const holidayDay = holidayLocalDate.getDate();
      
      // Check each year in the range
      const fromYear = fromLocal.getFullYear();
      const toYear = toLocal.getFullYear();
      
      for (let year = fromYear; year <= toYear; year++) {
        const yearlyHoliday = new Date(year, holidayMonth, holidayDay);
        if (yearlyHoliday >= fromLocalStart && yearlyHoliday <= toLocalEnd) {
          const yearlyDateKey = format(yearlyHoliday, "yyyy-MM-dd");
          holidayMap.set(yearlyDateKey, holiday.name);
        }
      }
    } else {
      // One-time holiday
      if (holidayLocalDate >= fromLocalStart && holidayLocalDate <= toLocalEnd) {
        holidayMap.set(dateKey, holiday.name);
      }
    }
  }

  // 9. Generate all days in range (in local timezone)
  const daysInRange = eachDayOfInterval({
    start: fromLocalStart,
    end: toLocalEnd,
  });

  // 10. Build PlanningDay array
  const planningDays: PlanningDay[] = daysInRange.map((localDay) => {
    const dateLocalISO = format(localDay, "yyyy-MM-dd");
    const dayOfWeek = getDay(localDay);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holidayName = holidayMap.get(dateLocalISO);
    const isHoliday = !!holidayName;

    return {
      dateLocalISO,
      isWeekend,
      isHoliday,
      holidayName,
    };
  });

  // 11. Build DaySchedule map by employeeId and dateLocalISO
  const dayScheduleMap = new Map<string, typeof daySchedules[0]>();
  for (const schedule of daySchedules) {
    const scheduleLocalDate = toZonedTime(schedule.date, clientTimeZone);
    const dateKey = format(scheduleLocalDate, "yyyy-MM-dd");
    const mapKey = `${schedule.employeeId}:${dateKey}`;
    dayScheduleMap.set(mapKey, schedule);
  }

  // 12. Build Application map by employeeId and dateLocalISO
  const applicationMap = new Map<string, typeof applications[0][]>();
  for (const app of applications) {
    const appStartLocal = toZonedTime(app.startDate, clientTimeZone);
    const appEndLocal = toZonedTime(app.endDate, clientTimeZone);
    
    // Generate all days this application covers
    const appDays = eachDayOfInterval({
      start: appStartLocal,
      end: appEndLocal,
    });

    for (const appDay of appDays) {
      const dateKey = format(appDay, "yyyy-MM-dd");
      const mapKey = `${app.employeeId}:${dateKey}`;
      
      if (!applicationMap.has(mapKey)) {
        applicationMap.set(mapKey, []);
      }
      applicationMap.get(mapKey)!.push(app);
    }
  }

  // 13. Build PlanningEmployee array
  const planningEmployees: PlanningEmployee[] = employees.map((emp) => ({
    id: emp.id,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    departmentId: emp.departmentId,
    departmentName: emp.department.name,
  }));

  // 14. Build PlanningCell array (cartesian product of employees × days)
  const planningCells: PlanningCell[] = [];
  for (const employee of planningEmployees) {
    for (const day of planningDays) {
      const mapKey = `${employee.id}:${day.dateLocalISO}`;
      
      // Get DaySchedule for this cell
      const schedule = dayScheduleMap.get(mapKey);
      const daySchedule = schedule
        ? {
            status: schedule.status,
            unavailabilityReasonId: schedule.unavailabilityReasonId,
            unavailabilityReasonName: schedule.unavailabilityReason?.name ?? null,
            unavailabilityReasonColor: schedule.unavailabilityReason?.colorCode ?? null,
            applicationId: schedule.applicationId,
          }
        : null;

      // Get Applications for this cell
      const cellApplications = applicationMap.get(mapKey) ?? [];
      const applicationsForCell = cellApplications.map((app) => {
        const appStartLocal = toZonedTime(app.startDate, clientTimeZone);
        const appEndLocal = toZonedTime(app.endDate, clientTimeZone);
        
        return {
          id: app.id,
          status: app.status,
          unavailabilityReasonId: app.unavailabilityReasonId,
          unavailabilityReasonName: app.unavailabilityReason.name,
          unavailabilityReasonColor: app.unavailabilityReason.colorCode,
          startDateLocalISO: format(appStartLocal, "yyyy-MM-dd"),
          endDateLocalISO: format(appEndLocal, "yyyy-MM-dd"),
        };
      });

      planningCells.push({
        employeeId: employee.id,
        dateLocalISO: day.dateLocalISO,
        daySchedule,
        applications: applicationsForCell,
      });
    }
  }

  return {
    employees: planningEmployees,
    days: planningDays,
    cells: planningCells,
  };
}

