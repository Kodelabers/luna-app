import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from "@/lib/errors";
import { eachDayOfInterval, getDay, parseISO, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { SickLeaveStatus, Prisma } from "@prisma/client";

/**
 * Input for opening sick leave (UC-SL-01)
 */
export type OpenSickLeaveInput = {
  employeeId: string;
  unavailabilityReasonId: string;
  startDateLocalISO: string;
  clientTimeZone: string;
  note?: string;
};

/**
 * Input for closing sick leave (UC-SL-02)
 */
export type CloseSickLeaveInput = {
  sickLeaveId: string;
  endDateLocalISO: string;
  clientTimeZone: string;
  note?: string;
};

/**
 * Input for cancelling sick leave (UC-SL-03)
 */
export type CancelSickLeaveInput = {
  sickLeaveId: string;
};

/**
 * Filters for listing sick leaves (UC-SL-04)
 */
export type SickLeaveFilters = {
  status?: SickLeaveStatus;
  departmentId?: string;
  employeeId?: string;
};

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
      holidayDates.add(
        `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      );
    } else {
      const year = holidayLocal.getFullYear();
      holidayDates.add(
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      );
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
 * Check if there's an overlap with existing sick leaves for an employee
 */
async function checkSickLeaveOverlap(
  ctx: TenantContext,
  employeeId: string,
  startDate: Date,
  endDate: Date | null,
  excludeSickLeaveId?: string
): Promise<boolean> {
  const where: Prisma.SickLeaveWhereInput = {
    organisationId: ctx.organisationId,
    employeeId,
    active: true,
    status: {
      in: ["OPENED", "CLOSED"],
    },
  };

  if (excludeSickLeaveId) {
    where.id = { not: excludeSickLeaveId };
  }

  const existingSickLeaves = await db.sickLeave.findMany({
    where,
  });

  for (const existing of existingSickLeaves) {
    // For OPENED sick leaves, endDate is null, so we consider it as ongoing
    const existingEnd = existing.endDate || new Date();

    // Check overlap
    if (endDate) {
      // Closed sick leave: check if [startDate, endDate] overlaps with existing
      if (startDate <= existingEnd && endDate >= existing.startDate) {
        return true;
      }
    } else {
      // Opened sick leave: check if startDate overlaps with existing
      if (startDate <= existingEnd && startDate >= existing.startDate) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Apply corrections to approved applications that overlap with sick leave
 * Implements "truncate" rule from 06_ledger_rules.md section 6.1 and 6.2
 * 
 * IMPORTANT: This function looks at DaySchedule records (materialized plan),
 * not Application records. This prevents duplicate corrections when sick leave
 * is cancelled and reopened - if DaySchedule records were already deleted,
 * there's nothing left to correct.
 */
async function applySickLeaveCorrections(
  ctx: TenantContext,
  sickLeave: {
    id: string;
    employeeId: string;
    startDate: Date;
    endDate: Date | null;
  },
  correctionFromLocal: Date,
  correctionToLocal: Date | null,
  clientTimeZone: string
): Promise<void> {
  const correctionFromUTC = fromZonedTime(correctionFromLocal, clientTimeZone);
  const correctionToUTC = correctionToLocal
    ? fromZonedTime(correctionToLocal, clientTimeZone)
    : null;

  // Find DaySchedule records that:
  // - belong to this employee
  // - have applicationId set (materialized from an approved application)
  // - are in the correction date range
  // - have unavailabilityReason with hasPlanning=true
  const daySchedulesToCorrect = await db.daySchedule.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: sickLeave.employeeId,
      applicationId: { not: null },
      active: true,
      date: {
        gte: correctionFromUTC,
        ...(correctionToUTC ? { lte: correctionToUTC } : {}),
      },
      unavailabilityReason: {
        hasPlanning: true,
      },
    },
    include: {
      application: {
        include: {
          unavailabilityReason: true,
        },
      },
    },
  });

  // If no DaySchedule records to correct, exit early
  if (daySchedulesToCorrect.length === 0) {
    return;
  }

  // Group DaySchedule records by applicationId
  const schedulesByApplication = new Map<string, typeof daySchedulesToCorrect>();
  for (const schedule of daySchedulesToCorrect) {
    if (!schedule.applicationId || !schedule.application) continue;
    
    const existing = schedulesByApplication.get(schedule.applicationId) ?? [];
    existing.push(schedule);
    schedulesByApplication.set(schedule.applicationId, existing);
  }

  // Process each application group
  for (const [applicationId, schedules] of schedulesByApplication) {
    const application = schedules[0].application!;
    
    // Count workdays (exclude weekends and holidays from the DaySchedule records)
    const workdays = schedules.filter(s => !s.isWeekend && !s.isHoliday).length;

    if (workdays === 0) {
      // Still delete the DaySchedule records even if no workdays
      await db.daySchedule.deleteMany({
        where: {
          id: { in: schedules.map(s => s.id) },
        },
      });
      continue;
    }

    // Get the year for ledger entry (based on application start date)
    const appStartLocal = toZonedTime(application.startDate, clientTimeZone);
    const year = appStartLocal.getFullYear();

    // Create CORRECTION ledger entry (returning days)
    // Note: No applicationId reference - this is a standalone materialized correction
    await db.unavailabilityLedgerEntry.create({
      data: {
        organisationId: ctx.organisationId,
        employeeId: sickLeave.employeeId,
        unavailabilityReasonId: application.unavailabilityReasonId,
        year,
        changeDays: workdays, // Positive = returning days
        type: "CORRECTION",
        note: `Korekcija zbog bolovanja (ID: ${sickLeave.id})`,
        createdById: ctx.organisationUser.id,
      },
    });

    // Delete DaySchedule records
    await db.daySchedule.deleteMany({
      where: {
        id: { in: schedules.map(s => s.id) },
      },
    });

    // Get date range for the comment
    const sortedDates = schedules.map(s => s.date).sort((a, b) => a.getTime() - b.getTime());
    const intervalStart = toZonedTime(sortedDates[0], clientTimeZone);
    const intervalEnd = toZonedTime(sortedDates[sortedDates.length - 1], clientTimeZone);

    // Create ApplicationLog for POST_APPROVAL_IMPACT_CHANGED
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId: applicationId,
        type: "POST_APPROVAL_IMPACT_CHANGED",
        createdById: ctx.organisationUser.id,
      },
    });

    // Add a comment to the application
    await db.applicationComment.create({
      data: {
        applicationId: applicationId,
        comment: `Zahtjev je djelomično prekinut zbog bolovanja od ${intervalStart.toLocaleDateString("hr-HR")} do ${intervalEnd.toLocaleDateString("hr-HR")}. Vraćeno ${workdays} radnih dana.`,
        createdById: ctx.organisationUser.id,
      },
    });
  }
}

/**
 * Open sick leave (UC-SL-01)
 */
export async function openSickLeave(
  ctx: TenantContext,
  input: OpenSickLeaveInput
): Promise<void> {
  const { employeeId, unavailabilityReasonId, startDateLocalISO, clientTimeZone, note } =
    input;

  // 1. Fetch employee with department
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

  // 2. Fetch unavailability reason and check sickLeave flag
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

  if (!reason.sickLeave) {
    throw new ValidationError({
      unavailabilityReasonId: ["Odabrana vrsta odsutnosti nije označena kao bolovanje"],
    });
  }

  // 3. Parse and validate start date
  const startDateLocal = parseISO(startDateLocalISO);
  const startDateUTC = fromZonedTime(startDateLocal, clientTimeZone);
  const now = new Date();

  if (startDateUTC > now) {
    throw new ValidationError({
      startDateLocalISO: ["Datum početka ne može biti u budućnosti"],
    });
  }

  // 4. Check for overlaps with existing sick leaves
  const hasOverlap = await checkSickLeaveOverlap(
    ctx,
    employeeId,
    startDateUTC,
    null
  );

  if (hasOverlap) {
    throw new ConflictError("Postoji preklapanje s drugim bolovanjem za ovog zaposlenika");
  }

  // 5. Create SickLeave record (status=OPENED, endDate=null)
  const sickLeave = await db.sickLeave.create({
    data: {
      organisationId: ctx.organisationId,
      employeeId,
      departmentId: employee.departmentId,
      unavailabilityReasonId,
      startDate: startDateUTC,
      endDate: null,
      status: "OPENED",
      note,
    },
  });

  // 6. Materialize ONLY start day in DaySchedule
  const dayOfWeek = getDay(startDateUTC);
  const dayCodeMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayCode = dayCodeMap[dayOfWeek];

  // Check if it's a holiday
  const startDateLocalForHoliday = toZonedTime(startDateUTC, clientTimeZone);
  const month = startDateLocalForHoliday.getMonth() + 1;
  const day = startDateLocalForHoliday.getDate();
  const year = startDateLocalForHoliday.getFullYear();

  const holidayExists = await db.holiday.findFirst({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      OR: [
        {
          repeatYearly: true,
          date: {
            gte: new Date(2000, month - 1, day),
            lt: new Date(2000, month - 1, day + 1),
          },
        },
        {
          repeatYearly: false,
          date: {
            gte: new Date(year, month - 1, day),
            lt: new Date(year, month - 1, day + 1),
          },
        },
      ],
    },
  });

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHoliday = !!holidayExists;

  // Upsert DaySchedule for start day
  await db.daySchedule.upsert({
    where: {
      organisationId_employeeId_date: {
        organisationId: ctx.organisationId,
        employeeId,
        date: startDateUTC,
      },
    },
    create: {
      organisationId: ctx.organisationId,
      employeeId,
      date: startDateUTC,
      sickLeaveId: sickLeave.id,
      unavailabilityReasonId,
      status: "NOT_AVAILABLE",
      isWeekend,
      isHoliday,
      dayCode: dayCode as any,
    },
    update: {
      sickLeaveId: sickLeave.id,
      unavailabilityReasonId,
      status: "NOT_AVAILABLE",
      isWeekend,
      isHoliday,
      active: true,
    },
  });

  // 7. Apply corrections (truncate) for approved applications from startDate onwards
  // For OPENED sick leave, correctionTo is null (ongoing)
  await applySickLeaveCorrections(
    ctx,
    sickLeave,
    startDateLocal,
    null,
    clientTimeZone
  );
}

/**
 * Close sick leave (UC-SL-02)
 */
export async function closeSickLeave(
  ctx: TenantContext,
  input: CloseSickLeaveInput
): Promise<void> {
  const { sickLeaveId, endDateLocalISO, clientTimeZone, note } = input;

  // 1. Fetch sick leave
  const sickLeave = await db.sickLeave.findFirst({
    where: {
      id: sickLeaveId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!sickLeave) {
    throw new NotFoundError("Bolovanje nije pronađeno");
  }

  // 2. Check status (must be OPENED)
  if (sickLeave.status !== "OPENED") {
    throw new ConflictError("Bolovanje mora biti u statusu OPENED");
  }

  // 3. Parse and validate end date
  const endDateLocal = parseISO(endDateLocalISO);
  const endDateUTC = fromZonedTime(endDateLocal, clientTimeZone);
  const startDateLocal = toZonedTime(sickLeave.startDate, clientTimeZone);

  if (endDateUTC <= sickLeave.startDate) {
    throw new ValidationError({
      endDateLocalISO: ["Datum završetka mora biti nakon datuma početka"],
    });
  }

  // 4. Update SickLeave (status=CLOSED, endDate=...)
  await db.sickLeave.update({
    where: { id: sickLeaveId },
    data: {
      status: "CLOSED",
      endDate: endDateUTC,
      note: note || sickLeave.note,
    },
  });

  // 5. Upsert DaySchedule for all days in range [startDate..endDate]
  const daysInRange = eachDayOfInterval({
    start: sickLeave.startDate,
    end: endDateUTC,
  });

  for (const dayUTC of daysInRange) {
    const dayOfWeek = getDay(dayUTC);
    const dayCodeMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayCode = dayCodeMap[dayOfWeek];

    // Check if it's a holiday
    const dayLocal = toZonedTime(dayUTC, clientTimeZone);
    const month = dayLocal.getMonth() + 1;
    const day = dayLocal.getDate();
    const year = dayLocal.getFullYear();

    const holidayExists = await db.holiday.findFirst({
      where: {
        organisationId: ctx.organisationId,
        active: true,
        OR: [
          {
            repeatYearly: true,
            date: {
              gte: new Date(2000, month - 1, day),
              lt: new Date(2000, month - 1, day + 1),
            },
          },
          {
            repeatYearly: false,
            date: {
              gte: new Date(year, month - 1, day),
              lt: new Date(year, month - 1, day + 1),
            },
          },
        ],
      },
    });

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = !!holidayExists;

    await db.daySchedule.upsert({
      where: {
        organisationId_employeeId_date: {
          organisationId: ctx.organisationId,
          employeeId: sickLeave.employeeId,
          date: dayUTC,
        },
      },
      create: {
        organisationId: ctx.organisationId,
        employeeId: sickLeave.employeeId,
        date: dayUTC,
        sickLeaveId: sickLeave.id,
        unavailabilityReasonId: sickLeave.unavailabilityReasonId,
        status: "NOT_AVAILABLE",
        isWeekend,
        isHoliday,
        dayCode: dayCode as any,
      },
      update: {
        sickLeaveId: sickLeave.id,
        unavailabilityReasonId: sickLeave.unavailabilityReasonId,
        status: "NOT_AVAILABLE",
        isWeekend,
        isHoliday,
        active: true,
      },
    });
  }

  // 6. Apply corrections for the full range
  await applySickLeaveCorrections(
    ctx,
    {
      id: sickLeave.id,
      employeeId: sickLeave.employeeId,
      startDate: sickLeave.startDate,
      endDate: endDateUTC,
    },
    startDateLocal,
    endDateLocal,
    clientTimeZone
  );
}

/**
 * Cancel sick leave (UC-SL-03)
 */
export async function cancelSickLeave(
  ctx: TenantContext,
  input: CancelSickLeaveInput
): Promise<void> {
  const { sickLeaveId } = input;

  // 1. Fetch sick leave
  const sickLeave = await db.sickLeave.findFirst({
    where: {
      id: sickLeaveId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!sickLeave) {
    throw new NotFoundError("Bolovanje nije pronađeno");
  }

  // 2. Check status (must be OPENED and endDate must be null)
  if (sickLeave.status !== "OPENED") {
    throw new ConflictError("Poništavanje je dozvoljeno samo za otvorena bolovanja");
  }

  if (sickLeave.endDate !== null) {
    throw new ConflictError("Bolovanje ima definirani datum završetka i ne može biti poništeno");
  }

  // 3. Update SickLeave (status=CANCELLED)
  await db.sickLeave.update({
    where: { id: sickLeaveId },
    data: {
      status: "CANCELLED",
    },
  });

  // 4. Delete DaySchedule records created by this sick leave (only start day for OPENED)
  await db.daySchedule.deleteMany({
    where: {
      organisationId: ctx.organisationId,
      sickLeaveId: sickLeave.id,
    },
  });

  // Note: Cancel does NOT revert corrections (ledger + logs remain)
}

/**
 * List sick leaves (UC-SL-04)
 */
export async function listSickLeaves(
  ctx: TenantContext,
  filters: SickLeaveFilters
): Promise<any[]> {
  const where: Prisma.SickLeaveWhereInput = {
    organisationId: ctx.organisationId,
    active: true,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  const sickLeaves = await db.sickLeave.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      unavailabilityReason: {
        select: {
          id: true,
          name: true,
          colorCode: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return sickLeaves;
}

