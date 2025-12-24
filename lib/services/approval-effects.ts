import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import { Application, UnavailabilityReason, DayCode, EmployeeStatus } from "@prisma/client";
import { eachDayOfInterval, getDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Apply approval effects when Application becomes APPROVED (UC-DASH-05, UC-APP-08/09)
 * - DaySchedule upsert per 05_dayschedule_rules.md
 * - Ledger USAGE entry when hasPlanning=true per 06_ledger_rules.md
 * - Basic CORRECTION when overwriting existing DaySchedule from hasPlanning=true reason
 */
export async function applyApprovalEffects(
  ctx: TenantContext,
  application: Application & { unavailabilityReason: UnavailabilityReason },
  clientTimeZone: string
): Promise<void> {
  const { startDate, endDate, employeeId, unavailabilityReasonId, id: applicationId } = application;
  const { hasPlanning, needApproval } = application.unavailabilityReason;

  // Generate all days in the approved range (UTC dates)
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Fetch holidays to determine isHoliday flag
  const holidays = await db.holiday.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      OR: [
        {
          repeatYearly: false,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          repeatYearly: true,
        },
      ],
    },
  });

  // Build holiday map by local date
  const holidayDates = new Set<string>();
  for (const holiday of holidays) {
    const holidayLocal = toZonedTime(holiday.date, clientTimeZone);
    const month = holidayLocal.getMonth() + 1;
    const day = holidayLocal.getDate();
    
    if (holiday.repeatYearly) {
      // For yearly holidays, store as MM-DD
      holidayDates.add(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    } else {
      // For one-time holidays, store full date
      const year = holidayLocal.getFullYear();
      holidayDates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }

  // Fetch existing DaySchedule records in the range to detect overlaps
  const existingSchedules = await db.daySchedule.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      active: true,
    },
    include: {
      unavailabilityReason: {
        select: {
          hasPlanning: true,
        },
      },
      application: {
        select: {
          id: true,
        },
      },
    },
  });

  // Build map of existing schedules by date
  const existingScheduleMap = new Map<string, typeof existingSchedules[0]>();
  for (const schedule of existingSchedules) {
    existingScheduleMap.set(schedule.date.toISOString(), schedule);
  }

  // Track correction info for ledger
  let correctionDays = 0;
  const correctedApplicationIds = new Set<number>();

  // Upsert DaySchedule for each day
  for (const utcDay of daysInRange) {
    const dayLocal = toZonedTime(utcDay, clientTimeZone);
    const dayOfWeek = getDay(utcDay);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check if this day is a holiday
    const month = dayLocal.getMonth() + 1;
    const day = dayLocal.getDate();
    const year = dayLocal.getFullYear();
    const yearlyKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const fullKey = `${year}-${yearlyKey}`;
    const isHoliday = holidayDates.has(yearlyKey) || holidayDates.has(fullKey);

    // Map day of week to DayCode
    const dayCodeMap: Record<number, DayCode> = {
      0: "SUN",
      1: "MON",
      2: "TUE",
      3: "WED",
      4: "THU",
      5: "FRI",
      6: "SAT",
    };
    const dayCode = dayCodeMap[dayOfWeek];

    // Determine status based on unavailability reason
    // For now, use NOT_AVAILABLE when there's an unavailability reason
    const status: EmployeeStatus = unavailabilityReasonId ? "NOT_AVAILABLE" : "AVAILABLE";

    // Check if we're overwriting an existing schedule from hasPlanning=true reason
    const existingSchedule = existingScheduleMap.get(utcDay.toISOString());
    if (
      existingSchedule &&
      existingSchedule.unavailabilityReason?.hasPlanning &&
      existingSchedule.applicationId !== applicationId
    ) {
      // Count this day for correction (only workdays)
      if (!isWeekend && !isHoliday) {
        correctionDays++;
      }
      
      // Track the corrected application
      if (existingSchedule.applicationId) {
        correctedApplicationIds.add(existingSchedule.applicationId);
      }
    }

    // Upsert DaySchedule (respects unique constraint)
    await db.daySchedule.upsert({
      where: {
        organisationId_employeeId_date: {
          organisationId: ctx.organisationId,
          employeeId,
          date: utcDay,
        },
      },
      create: {
        organisationId: ctx.organisationId,
        employeeId,
        date: utcDay,
        applicationId,
        unavailabilityReasonId,
        status,
        isWeekend,
        isHoliday,
        dayCode,
        active: true,
      },
      update: {
        applicationId,
        unavailabilityReasonId,
        status,
        isWeekend,
        isHoliday,
        dayCode,
        active: true,
      },
    });
  }

  // Calculate workdays (exclude weekends and holidays)
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

  // Update requestedWorkdays if not already set
  if (application.requestedWorkdays === null) {
    await db.application.update({
      where: { id: applicationId },
      data: { requestedWorkdays: workdays },
    });
  }

  // Ledger effects only if hasPlanning=true
  if (hasPlanning) {
    // Determine year for ledger (year of startDate in client timezone)
    const startLocal = toZonedTime(startDate, clientTimeZone);
    const ledgerYear = startLocal.getFullYear();

    // USAGE entry (negative)
    await db.unavailabilityLedgerEntry.create({
      data: {
        organisationId: ctx.organisationId,
        employeeId,
        unavailabilityReasonId,
        year: ledgerYear,
        changeDays: -workdays,
        type: "USAGE",
        applicationId,
        createdById: ctx.organisationUser.id,
        note: `Potrošnja za odobreni zahtjev #${applicationId}`,
      },
    });

    // CORRECTION entry if we overwrote hasPlanning=true schedules
    if (correctionDays > 0) {
      // Find the previous reason(s) that were overwritten
      // For simplicity, we'll create one correction per overwritten application
      for (const correctedAppId of correctedApplicationIds) {
        const correctedApp = await db.application.findUnique({
          where: { id: correctedAppId },
          select: {
            unavailabilityReasonId: true,
            unavailabilityReason: {
              select: {
                hasPlanning: true,
              },
            },
          },
        });

        if (correctedApp?.unavailabilityReason.hasPlanning) {
          // Return the days (positive correction)
          await db.unavailabilityLedgerEntry.create({
            data: {
              organisationId: ctx.organisationId,
              employeeId,
              unavailabilityReasonId: correctedApp.unavailabilityReasonId,
              year: ledgerYear,
              changeDays: correctionDays,
              type: "CORRECTION",
              applicationId: correctedAppId,
              createdById: ctx.organisationUser.id,
              note: `Korekcija zbog prepisivanja zahtjevom #${applicationId}`,
            },
          });

          // Log the impact on the corrected application
          await db.applicationLog.create({
            data: {
              organisationId: ctx.organisationId,
              applicationId: correctedAppId,
              type: "POST_APPROVAL_IMPACT_CHANGED",
              createdById: ctx.organisationUser.id,
            },
          });
        }
      }
    }
  }
}

