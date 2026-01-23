import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { eachDayOfInterval, getDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { ApplicationStatus, LedgerEntryType } from "@prisma/client";

/**
 * Calculate workdays in a date range (excluding weekends and holidays)
 */
async function calculateWorkdays(
  ctx: TenantContext,
  startDate: Date,
  endDate: Date,
  clientTimeZone: string
): Promise<number> {
  // Convert to UTC for DB queries
  const startUTC = fromZonedTime(startDate, clientTimeZone);
  const endUTC = fromZonedTime(endDate, clientTimeZone);

  // Fetch holidays
  const holidays = await db.holiday.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      OR: [
        {
          repeatYearly: false,
          date: {
            gte: startUTC,
            lte: endUTC,
          },
        },
        {
          repeatYearly: true,
        },
      ],
    },
  });

  // Build holiday map
  const holidayDates = new Set<string>();
  for (const holiday of holidays) {
    const holidayLocal = toZonedTime(holiday.date, clientTimeZone);
    const month = holidayLocal.getMonth() + 1;
    const day = holidayLocal.getDate();

    if (holiday.repeatYearly) {
      holidayDates.add(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    } else {
      const year = holidayLocal.getFullYear();
      holidayDates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }

  // Get all days in range
  const daysInRange = eachDayOfInterval({ start: startUTC, end: endUTC });

  // Calculate workdays
  let workdays = 0;
  for (const utcDay of daysInRange) {
    const dayLocal = toZonedTime(utcDay, clientTimeZone);
    const dayOfWeek = getDay(utcDay);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const month = dayLocal.getMonth() + 1;
    const day = dayLocal.getDate();
    const year = dayLocal.getFullYear();
    const yearlyKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const fullKey = `${year}-${yearlyKey}`;
    const isHoliday = holidayDates.has(yearlyKey) || holidayDates.has(fullKey);

    if (!isWeekend && !isHoliday) {
      workdays++;
    }
  }

  return workdays;
}

/**
 * Get days balance for a specific employee, reason, and year
 */
export async function getDaysBalance(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string,
  year: number
): Promise<number> {
  const ledgerEntries = await db.unavailabilityLedgerEntry.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
    },
  });

  return ledgerEntries.reduce((sum, entry) => sum + entry.changeDays, 0);
}

/**
 * Get open (active) year for employee and reason
 * Returns the latest year that has an ALLOCATION entry, or null if none exists
 * openYear is always the latest (most recent) year with an allocation
 */
export async function getOpenYear(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string
): Promise<number | null> {
  const latestAllocation = await db.unavailabilityLedgerEntry.findFirst({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      type: "ALLOCATION",
    },
    orderBy: {
      year: "desc",
    },
    select: {
      year: true,
    },
  });

  return latestAllocation?.year ?? null;
}

/**
 * Get balance for open year (for transfer message)
 */
export async function getOpenYearBalance(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string,
  openYear: number
): Promise<number> {
  return getDaysBalance(ctx, employeeId, unavailabilityReasonId, openYear);
}

/**
 * Get pending days (SUBMITTED/APPROVED_FIRST_LEVEL applications) for a specific employee, reason, and year
 */
export async function getPendingDays(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string,
  year: number,
  clientTimeZone: string
): Promise<number> {
  // Get all SUBMITTED/APPROVED_FIRST_LEVEL applications for this employee and reason
  const pendingApplications = await db.application.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      active: true,
      status: {
        in: ["SUBMITTED", "APPROVED_FIRST_LEVEL"],
      },
    },
  });

  let totalPendingDays = 0;

  for (const app of pendingApplications) {
    // Check if application starts in this year (in client timezone)
    const startLocal = toZonedTime(app.startDate, clientTimeZone);
    const appYear = startLocal.getFullYear();

    if (appYear === year) {
      // Calculate workdays for this application
      const endLocal = toZonedTime(app.endDate, clientTimeZone);
      const workdays = await calculateWorkdays(ctx, startLocal, endLocal, clientTimeZone);
      totalPendingDays += workdays;
    }
  }

  return totalPendingDays;
}

/**
 * Days balance breakdown for a specific employee, reason, and year
 */
export type DaysBalanceBreakdown = {
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  balance: number;
};

/**
 * Get detailed days balance breakdown
 */
export async function getDaysBalanceBreakdown(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string,
  year: number,
  clientTimeZone: string
): Promise<DaysBalanceBreakdown> {
  const ledgerEntries = await db.unavailabilityLedgerEntry.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
    },
  });

  // Calculate allocated (ALLOCATION entries)
  const allocated = ledgerEntries
    .filter((entry) => entry.type === "ALLOCATION")
    .reduce((sum, entry) => sum + entry.changeDays, 0);

  // Calculate used (USAGE entries - they are negative)
  const used = Math.abs(
    ledgerEntries
      .filter((entry) => entry.type === "USAGE")
      .reduce((sum, entry) => sum + entry.changeDays, 0)
  );

  // Calculate total balance (sum of all changeDays)
  const balance = ledgerEntries.reduce((sum, entry) => sum + entry.changeDays, 0);

  // Get pending days
  const pending = await getPendingDays(ctx, employeeId, unavailabilityReasonId, year, clientTimeZone);

  // Remaining = balance - pending
  const remaining = balance - pending;

  return {
    allocated,
    used,
    pending,
    remaining,
    balance,
  };
}

/**
 * Days balance by year for a specific employee and reason
 */
export type DaysBalanceByYear = {
  year: number;
  breakdown: DaysBalanceBreakdown;
};

/**
 * Get days balance by year for multiple years
 */
export async function getDaysBalanceByYear(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string,
  years: number[],
  clientTimeZone: string
): Promise<DaysBalanceByYear[]> {
  const results: DaysBalanceByYear[] = [];

  for (const year of years) {
    const breakdown = await getDaysBalanceBreakdown(
      ctx,
      employeeId,
      unavailabilityReasonId,
      year,
      clientTimeZone
    );
    results.push({ year, breakdown });
  }

  return results;
}

/**
 * Days balance for an employee by unavailability reason (current year)
 */
export type EmployeeDaysBalance = {
  unavailabilityReasonId: string;
  unavailabilityReasonName: string;
  unavailabilityReasonColorCode: string | null;
  openYear: number | null; // NEW - zadnja godina s ALLOCATION
  openYearBalance: number | null; // NEW - balance otvorene godine ako postoji openYear
  breakdown: DaysBalanceBreakdown;
};

/**
 * Get days balance for an employee by all unavailability reasons (current year)
 */
export async function getDaysBalanceForEmployee(
  ctx: TenantContext,
  employeeId: string,
  currentYear: number,
  clientTimeZone: string
): Promise<EmployeeDaysBalance[]> {
  // Get all active unavailability reasons with hasPlanning=true
  const reasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      hasPlanning: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const results: EmployeeDaysBalance[] = [];

  for (const reason of reasons) {
    // Get open year first (before calculating breakdown)
    const openYear = await getOpenYear(ctx, employeeId, reason.id);
    
    // Calculate breakdown for openYear (if exists), otherwise return empty breakdown
    const breakdown = openYear !== null
      ? await getDaysBalanceBreakdown(
          ctx,
          employeeId,
          reason.id,
          openYear,
          clientTimeZone
        )
      : { allocated: 0, used: 0, pending: 0, remaining: 0, balance: 0 };

    // Get open year balance (if openYear exists)
    const openYearBalance = openYear !== null
      ? await getOpenYearBalance(ctx, employeeId, reason.id, openYear)
      : null;

    results.push({
      unavailabilityReasonId: reason.id,
      unavailabilityReasonName: reason.name,
      unavailabilityReasonColorCode: reason.colorCode,
      openYear,
      openYearBalance,
      breakdown,
    });
  }

  return results;
}

/**
 * Days balance for multiple employees (manager view)
 */
export type ManagerEmployeeDaysBalance = {
  employeeId: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeEmail: string;
  departmentId: string;
  departmentName: string;
  balances: EmployeeDaysBalance[];
};

/**
 * Get days balance for multiple employees in manager scope (OPTIMIZED - batch queries)
 * 
 * Performance optimization: Instead of N+1 queries (one per employee+reason combination),
 * this function uses batch queries to fetch all data in minimal database round-trips:
 * 1. Single query for employees
 * 2. Single query for reasons
 * 3. Single query for all open years (ALLOCATION entries)
 * 4. Single query for all ledger entries
 * 5. Single query for all pending applications
 * 6. Single query for holidays (reused for all workday calculations)
 * 
 * For 10 employees × 3 reasons, this reduces ~130+ queries to ~6 queries.
 */
export async function getDaysBalanceForManager(
  ctx: TenantContext,
  employeeIds: string[],
  currentYear: number,
  clientTimeZone: string
): Promise<ManagerEmployeeDaysBalance[]> {
  if (employeeIds.length === 0) {
    return [];
  }

  // 1. Get employees with their departments (single query)
  const employees = await db.employee.findMany({
    where: {
      organisationId: ctx.organisationId,
      id: { in: employeeIds },
      active: true,
    },
    include: {
      department: {
        select: {
          id: true,
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

  if (employees.length === 0) {
    return [];
  }

  // 2. Get all active unavailability reasons with hasPlanning=true (single query)
  const reasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      hasPlanning: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (reasons.length === 0) {
    // Return employees with empty balances
    return employees.map((emp) => ({
      employeeId: emp.id,
      employeeFirstName: emp.firstName,
      employeeLastName: emp.lastName,
      employeeEmail: emp.email,
      departmentId: emp.departmentId,
      departmentName: emp.department.name,
      balances: [],
    }));
  }

  // 3. Batch fetch all open years for all employee+reason combinations (single query)
  const openYearEntries = await db.unavailabilityLedgerEntry.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: { in: employeeIds },
      unavailabilityReasonId: { in: reasons.map((r) => r.id) },
      type: "ALLOCATION",
    },
    select: {
      employeeId: true,
      unavailabilityReasonId: true,
      year: true,
    },
    orderBy: [
      { employeeId: "asc" },
      { unavailabilityReasonId: "asc" },
      { year: "desc" },
    ],
  });

  // Build openYear map: (employeeId, reasonId) -> year
  const openYearMap = new Map<string, number>();
  for (const entry of openYearEntries) {
    const key = `${entry.employeeId}:${entry.unavailabilityReasonId}`;
    if (!openYearMap.has(key)) {
      // First entry for this combination is the latest (due to orderBy year desc)
      openYearMap.set(key, entry.year);
    }
  }

  // 4. Collect all (employeeId, reasonId, year) combinations that need ledger entries
  const ledgerKeys: Array<{ employeeId: string; reasonId: string; year: number }> = [];
  for (const employee of employees) {
    for (const reason of reasons) {
      const key = `${employee.id}:${reason.id}`;
      const openYear = openYearMap.get(key);
      if (openYear !== undefined) {
        ledgerKeys.push({ employeeId: employee.id, reasonId: reason.id, year: openYear });
      }
    }
  }

  // 5. Batch fetch all ledger entries (single query)
  const allLedgerEntries = ledgerKeys.length > 0
    ? await db.unavailabilityLedgerEntry.findMany({
        where: {
          organisationId: ctx.organisationId,
          OR: ledgerKeys.map((k) => ({
            employeeId: k.employeeId,
            unavailabilityReasonId: k.reasonId,
            year: k.year,
          })),
        },
      })
    : [];

  // Group ledger entries by (employeeId, reasonId, year)
  const ledgerMap = new Map<string, typeof allLedgerEntries>();
  for (const entry of allLedgerEntries) {
    const key = `${entry.employeeId}:${entry.unavailabilityReasonId}:${entry.year}`;
    if (!ledgerMap.has(key)) {
      ledgerMap.set(key, []);
    }
    ledgerMap.get(key)!.push(entry);
  }

  // 6. Batch fetch all pending applications (single query)
  const pendingApplications = await db.application.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: { in: employeeIds },
      unavailabilityReasonId: { in: reasons.map((r) => r.id) },
      active: true,
      status: {
        in: ["SUBMITTED", "APPROVED_FIRST_LEVEL"],
      },
    },
    select: {
      id: true,
      employeeId: true,
      unavailabilityReasonId: true,
      startDate: true,
      endDate: true,
    },
  });

  // Group pending applications by (employeeId, reasonId) and calculate workdays per year
  // Pre-fetch holidays once for all calculations
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 1, 0, 1);
  const maxDate = new Date(now.getFullYear() + 1, 11, 31);
  const minDateUTC = fromZonedTime(minDate, clientTimeZone);
  const maxDateUTC = fromZonedTime(maxDate, clientTimeZone);

  const holidays = await db.holiday.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      OR: [
        {
          repeatYearly: false,
          date: {
            gte: minDateUTC,
            lte: maxDateUTC,
          },
        },
        {
          repeatYearly: true,
        },
      ],
    },
  });

  // Build holiday map (reusable for all workday calculations)
  const holidayDates = new Set<string>();
  for (const holiday of holidays) {
    const holidayLocal = toZonedTime(holiday.date, clientTimeZone);
    const month = holidayLocal.getMonth() + 1;
    const day = holidayLocal.getDate();

    if (holiday.repeatYearly) {
      holidayDates.add(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    } else {
      const year = holidayLocal.getFullYear();
      holidayDates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }

  // Helper function to calculate workdays with pre-fetched holidays
  function calculateWorkdaysWithHolidays(startDate: Date, endDate: Date): number {
    const startUTC = fromZonedTime(startDate, clientTimeZone);
    const endUTC = fromZonedTime(endDate, clientTimeZone);
    const daysInRange = eachDayOfInterval({ start: startUTC, end: endUTC });

    let workdays = 0;
    for (const utcDay of daysInRange) {
      const dayLocal = toZonedTime(utcDay, clientTimeZone);
      const dayOfWeek = getDay(utcDay);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const month = dayLocal.getMonth() + 1;
      const day = dayLocal.getDate();
      const year = dayLocal.getFullYear();
      const yearlyKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const fullKey = `${year}-${yearlyKey}`;
      const isHoliday = holidayDates.has(yearlyKey) || holidayDates.has(fullKey);

      if (!isWeekend && !isHoliday) {
        workdays++;
      }
    }

    return workdays;
  }

  // Calculate pending days per (employeeId, reasonId, year)
  const pendingDaysMap = new Map<string, number>();
  for (const app of pendingApplications) {
    const startLocal = toZonedTime(app.startDate, clientTimeZone);
    const appYear = startLocal.getFullYear();
    const key = `${app.employeeId}:${app.unavailabilityReasonId}:${appYear}`;
    
    const endLocal = toZonedTime(app.endDate, clientTimeZone);
    const workdays = calculateWorkdaysWithHolidays(startLocal, endLocal);
    
    pendingDaysMap.set(key, (pendingDaysMap.get(key) || 0) + workdays);
  }

  // 7. Build results
  const results: ManagerEmployeeDaysBalance[] = [];

  for (const employee of employees) {
    const balances: EmployeeDaysBalance[] = [];

    for (const reason of reasons) {
      const key = `${employee.id}:${reason.id}`;
      const openYear = openYearMap.get(key) ?? null;

      let breakdown: DaysBalanceBreakdown;
      let openYearBalance: number | null = null;

      if (openYear !== null) {
        // Get ledger entries for this combination
        const ledgerKey = `${employee.id}:${reason.id}:${openYear}`;
        const ledgerEntries = ledgerMap.get(ledgerKey) || [];

        // Calculate allocated (ALLOCATION entries)
        const allocated = ledgerEntries
          .filter((entry) => entry.type === "ALLOCATION")
          .reduce((sum, entry) => sum + entry.changeDays, 0);

        // Calculate used (USAGE entries - they are negative)
        const used = Math.abs(
          ledgerEntries
            .filter((entry) => entry.type === "USAGE")
            .reduce((sum, entry) => sum + entry.changeDays, 0)
        );

        // Calculate total balance (sum of all changeDays)
        const balance = ledgerEntries.reduce((sum, entry) => sum + entry.changeDays, 0);

        // Get pending days
        const pendingKey = `${employee.id}:${reason.id}:${openYear}`;
        const pending = pendingDaysMap.get(pendingKey) || 0;

        // Remaining = balance - pending
        const remaining = balance - pending;

        breakdown = {
          allocated,
          used,
          pending,
          remaining,
          balance,
        };

        // Calculate open year balance
        openYearBalance = balance;
      } else {
        breakdown = { allocated: 0, used: 0, pending: 0, remaining: 0, balance: 0 };
      }

      balances.push({
        unavailabilityReasonId: reason.id,
        unavailabilityReasonName: reason.name,
        unavailabilityReasonColorCode: reason.colorCode,
        openYear,
        openYearBalance,
        breakdown,
      });
    }

    results.push({
      employeeId: employee.id,
      employeeFirstName: employee.firstName,
      employeeLastName: employee.lastName,
      employeeEmail: employee.email,
      departmentId: employee.departmentId,
      departmentName: employee.department.name,
      balances,
    });
  }

  return results;
}

/**
 * Ledger history entry
 */
export type LedgerHistoryEntry = {
  id: string;
  year: number;
  type: LedgerEntryType;
  typeLabel: string; // UI label (Dodjela, Iskorištenje, Prijenos, Ispravak)
  changeDays: number;
  note: string | null;
  applicationId: string | null;
  createdAt: Date;
  createdBy: {
    firstName: string;
    lastName: string;
  } | null;
};

/**
 * Get ledger history for an employee and reason
 */
export async function getLedgerHistory(
  ctx: TenantContext,
  employeeId: string,
  unavailabilityReasonId: string,
  year?: number
): Promise<LedgerHistoryEntry[]> {
  const where: any = {
    organisationId: ctx.organisationId,
    employeeId,
    unavailabilityReasonId,
  };

  if (year !== undefined) {
    where.year = year;
  }

  const entries = await db.unavailabilityLedgerEntry.findMany({
    where,
    include: {
      createdBy: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map entry types to UI labels (per 09_terminology_glossary.md)
  const typeLabelMap: Record<LedgerEntryType, string> = {
    ALLOCATION: "Dodjela",
    USAGE: "Iskorištenje",
    TRANSFER: "Prijenos",
    CORRECTION: "Ispravak",
  };

  return entries.map((entry) => ({
    id: entry.id,
    year: entry.year,
    type: entry.type,
    typeLabel: typeLabelMap[entry.type],
    changeDays: entry.changeDays,
    note: entry.note,
    applicationId: entry.applicationId,
    createdAt: entry.createdAt,
    createdBy: entry.createdBy?.user
      ? {
          firstName: entry.createdBy.user.firstName,
          lastName: entry.createdBy.user.lastName,
        }
      : null,
  }));
}

/**
 * Input for allocating days
 */
export type AllocateDaysInput = {
  employeeId: string;
  unavailabilityReasonId: string;
  year: number;
  days: number;
  clientTimeZone: string; // For calculating currentYear
};

/**
 * Allocate days for an employee, reason, and year (UC-DAYS-04)
 * Automatically transfers remaining days from previous year if applicable
 */
export async function allocateDays(
  ctx: TenantContext,
  input: AllocateDaysInput
): Promise<{ success: true }> {
  const { employeeId, unavailabilityReasonId, year, days, clientTimeZone } = input;

  // Validate employee exists and is in organisation
  const employee = await db.employee.findFirst({
    where: {
      id: employeeId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!employee) {
    throw new NotFoundError("Zaposlenik nije pronađen");
  }

  // Validate unavailability reason exists
  const reason = await db.unavailabilityReason.findFirst({
    where: {
      id: unavailabilityReasonId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!reason) {
    throw new NotFoundError("Vrsta odsutnosti nije pronađena");
  }

  // Get current year in client timezone
  const now = new Date();
  const currentYear = toZonedTime(now, clientTimeZone).getFullYear();

  // Get open year
  const openYear = await getOpenYear(ctx, employeeId, unavailabilityReasonId);

  // Check if openYear is stale (older than currentYear - 1)
  const isStaleOpenYear = openYear !== null && openYear < currentYear - 1;

  // Validate year according to rules
  if (openYear !== null && !isStaleOpenYear) {
    // If openYear exists and is not stale, year must be openYear + 1 and <= currentYear + 1
    const expectedYear = openYear + 1;
    if (year !== expectedYear) {
      throw new ValidationError(
        { year: [`Godina mora biti ${expectedYear} (sljedeća nakon otvorene godine ${openYear})`] },
        `Godina mora biti ${expectedYear} (sljedeća nakon otvorene godine ${openYear})`
      );
    }
    if (year > currentYear + 1) {
      throw new ValidationError(
        { year: [`Ne možete otvoriti godinu unaprijed (maksimalno ${currentYear + 1})`] },
        `Ne možete otvoriti godinu unaprijed (maksimalno ${currentYear + 1})`
      );
    }
  } else {
    // If no openYear exists or openYear is stale, treat as "first plan": year must be in range currentYear-1..currentYear+1
    if (year < currentYear - 1 || year > currentYear + 1) {
      throw new ValidationError(
        { year: [`Godina mora biti u rasponu ${currentYear - 1}..${currentYear + 1}`] },
        `Godina mora biti u rasponu ${currentYear - 1}..${currentYear + 1}`
      );
    }
  }

  // Check if allocation already exists for this year (idempotency check)
  const existingAllocation = await db.unavailabilityLedgerEntry.findFirst({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
      type: "ALLOCATION",
    },
  });

  if (existingAllocation) {
    throw new ValidationError(
      {},
      `Dodjela za godinu ${year} već postoji. Koristite izmjenu umjesto nove dodjele.`
    );
  }

  // Create ALLOCATION entry
  await db.unavailabilityLedgerEntry.create({
    data: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
      changeDays: days,
      type: "ALLOCATION",
      createdById: ctx.organisationUser.id,
      note: `Dodjela dana za godinu ${year}`,
    },
  });

  // Check for automatic transfer from previous year (per 06_ledger_rules.md)
  // Transfer is only done for continuous year opening (openYear + 1), not for stale re-open
  const shouldTransfer = openYear !== null && !isStaleOpenYear && year === openYear + 1;

  if (shouldTransfer) {
    const previousYear = year - 1;
    const previousYearEntries = await db.unavailabilityLedgerEntry.findMany({
      where: {
        organisationId: ctx.organisationId,
        employeeId,
        unavailabilityReasonId,
        year: previousYear,
      },
    });

    const prevBalance = previousYearEntries.reduce((sum, entry) => sum + entry.changeDays, 0);

    // Check if transfer already exists (idempotency)
    const existingTransfer = await db.unavailabilityLedgerEntry.findFirst({
      where: {
        organisationId: ctx.organisationId,
        employeeId,
        unavailabilityReasonId,
        year: previousYear,
        type: "TRANSFER",
        note: "prijenos u iduću godinu",
      },
    });

    if (prevBalance > 0 && !existingTransfer) {
      // Create TRANSFER entry in previous year (closes previous year to 0)
      await db.unavailabilityLedgerEntry.create({
        data: {
          organisationId: ctx.organisationId,
          employeeId,
          unavailabilityReasonId,
          year: previousYear,
          changeDays: -prevBalance,
          type: "TRANSFER",
          createdById: ctx.organisationUser.id,
          note: "prijenos u iduću godinu",
        },
      });

      // Create TRANSFER entry in new year (adds transferred days)
      await db.unavailabilityLedgerEntry.create({
        data: {
          organisationId: ctx.organisationId,
          employeeId,
          unavailabilityReasonId,
          year,
          changeDays: prevBalance,
          type: "TRANSFER",
          createdById: ctx.organisationUser.id,
          note: "prijenos iz prethodne godine",
        },
      });
    }
  }

  return { success: true };
}

/**
 * Input for updating allocation
 */
export type UpdateAllocationInput = {
  employeeId: string;
  unavailabilityReasonId: string;
  year: number;
  adjustmentType: "INCREASE" | "DECREASE";
  adjustmentDays: number;
  clientTimeZone: string; // For calculating currentYear and validating openYear
};

/**
 * Update existing allocation (UC-DAYS-05)
 * Creates a CORRECTION entry to adjust the allocation
 */
export async function updateAllocation(
  ctx: TenantContext,
  input: UpdateAllocationInput
): Promise<{ success: true }> {
  const { employeeId, unavailabilityReasonId, year, adjustmentType, adjustmentDays, clientTimeZone } = input;

  // Validate employee exists and is in organisation
  const employee = await db.employee.findFirst({
    where: {
      id: employeeId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!employee) {
    throw new NotFoundError("Zaposlenik nije pronađen");
  }

  // Validate unavailability reason exists
  const reason = await db.unavailabilityReason.findFirst({
    where: {
      id: unavailabilityReasonId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!reason) {
    throw new NotFoundError("Vrsta odsutnosti nije pronađena");
  }

  // Get open year and validate that year is openYear
  const openYear = await getOpenYear(ctx, employeeId, unavailabilityReasonId);
  if (openYear === null) {
    throw new ValidationError(
      { year: ["Nema otvorene godine za izmjenu"] },
      "Nema otvorene godine za izmjenu"
    );
  }
  if (year !== openYear) {
    throw new ValidationError(
      { year: [`Izmjena je moguća samo za otvorenu godinu ${openYear}`] },
      `Izmjena je moguća samo za otvorenu godinu ${openYear}`
    );
  }

  // Get current allocation
  const currentAllocation = await db.unavailabilityLedgerEntry.findFirst({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
      type: "ALLOCATION",
    },
  });

  if (!currentAllocation) {
    throw new NotFoundError(`Dodjela za godinu ${year} nije pronađena`);
  }

  // Get all ledger entries for this year to calculate current balance
  const ledgerEntries = await db.unavailabilityLedgerEntry.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
    },
  });

  // Calculate current allocated (sum of ALLOCATION + all CORRECTION entries)
  // This gives us the current total allocation including all previous corrections
  const currentAllocated = ledgerEntries
    .filter((entry) => entry.type === "ALLOCATION" || entry.type === "CORRECTION")
    .reduce((sum, entry) => sum + entry.changeDays, 0);

  // Calculate used (absolute sum of USAGE entries)
  const used = Math.abs(
    ledgerEntries
      .filter((entry) => entry.type === "USAGE")
      .reduce((sum, entry) => sum + entry.changeDays, 0)
  );

  // Calculate adjustment (positive for increase, negative for decrease)
  const adjustment = adjustmentType === "INCREASE" ? adjustmentDays : -adjustmentDays;
  const newAllocated = currentAllocated + adjustment;

  // Validate: new allocated must be >= used
  if (newAllocated < used) {
    throw new ValidationError(
      { adjustmentDays: [`Nova dodjela (${newAllocated} dana) ne može biti manja od već iskorištenih dana (${used})`] },
      "Neispravan broj dana"
    );
  }

  // Validate: adjustment cannot result in negative allocation
  if (newAllocated < 0) {
    throw new ValidationError(
      { adjustmentDays: [`Dodjela ne može biti negativna. Trenutna dodjela: ${currentAllocated} dana`] },
      "Neispravan broj dana"
    );
  }

  if (adjustment === 0) {
    // No change needed
    return { success: true };
  }

  // Create CORRECTION entry with simple note format
  const adjustmentSign = adjustment > 0 ? "+" : "";
  await db.unavailabilityLedgerEntry.create({
    data: {
      organisationId: ctx.organisationId,
      employeeId,
      unavailabilityReasonId,
      year,
      changeDays: adjustment,
      type: "CORRECTION",
      createdById: ctx.organisationUser.id,
      note: `Ispravak dodjele ${adjustmentSign}${adjustmentDays} dana`,
    },
  });

  return { success: true };
}

