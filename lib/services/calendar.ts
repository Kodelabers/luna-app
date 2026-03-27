import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import { EmployeeStatus, DayCode } from "@prisma/client";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { startOfMonth, endOfMonth, addMonths, eachDayOfInterval, getDay, format } from "date-fns";

/**
 * Calendar day model for UC-DASH-02
 */
export type CalendarDay = {
  dateISO: string; // Local date in YYYY-MM-DD format for UI
  utcDateISO: string; // UTC date for reference
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  dayCode: DayCode;
  status: EmployeeStatus;
  unavailabilityReasonId: string | null;
  unavailabilityReasonName: string | null;
  unavailabilityReasonColor: string | null;
  applicationId: string | null;
};

/**
 * Get employee month calendar (UC-DASH-02)
 * Timezone-aware per 07_timezones_dates.md
 */
export async function getEmployeeMonthCalendar(
  ctx: TenantContext,
  params: {
    employeeId: string;
    month: number; // 1-12
    year: number;
    clientTimeZone: string; // IANA tz
    numberOfMonths?: number; // Number of months to fetch (default: 1)
  }
): Promise<CalendarDay[]> {
  const { employeeId, month, year, clientTimeZone, numberOfMonths = 1 } = params;

  // 1. Compute local month bounds in client timezone
  const localStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const localEnd = startOfMonth(addMonths(localStart, numberOfMonths));

  // 2. Convert to UTC bounds for DB query
  const utcStart = fromZonedTime(localStart, clientTimeZone);
  const utcEnd = fromZonedTime(localEnd, clientTimeZone);

  // 3. Fetch DaySchedule records for this employee in the range
  const daySchedules = await db.daySchedule.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId,
      date: {
        gte: utcStart,
        lt: utcEnd,
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
    orderBy: {
      date: "asc",
    },
  });

  // 4. Fetch holidays for the organisation
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
            lt: utcEnd,
          },
        },
        // Yearly holidays (we'll filter by month/day in code)
        {
          repeatYearly: true,
        },
      ],
    },
  });

  // 5. Build a map of holidays by local date (YYYY-MM-DD)
  const holidayMap = new Map<string, string>();

  for (const holiday of holidays) {
    const holidayLocalDate = toZonedTime(holiday.date, clientTimeZone);
    
    if (holiday.repeatYearly) {
      const holidayMonth = holidayLocalDate.getMonth() + 1;
      const holidayDay = holidayLocalDate.getDate();

      // Check every month in the range (supports numberOfMonths > 1)
      for (let i = 0; i < numberOfMonths; i++) {
        const rangeMonth = ((month - 1 + i) % 12) + 1;
        const rangeYear = year + Math.floor((month - 1 + i) / 12);
        if (holidayMonth === rangeMonth) {
          const dateKey = `${rangeYear}-${String(rangeMonth).padStart(2, "0")}-${String(holidayDay).padStart(2, "0")}`;
          holidayMap.set(dateKey, holiday.name);
        }
      }
    } else {
      // One-time holiday
      const dateKey = format(holidayLocalDate, "yyyy-MM-dd");
      holidayMap.set(dateKey, holiday.name);
    }
  }

  // 6. Build a map of DaySchedule by date (YYYY-MM-DD format)
  // Convert UTC timestamp to local date for mapping
  const scheduleMap = new Map<string, typeof daySchedules[0]>();
  for (const schedule of daySchedules) {
    const localDate = toZonedTime(schedule.date, clientTimeZone);
    const dateKey = format(localDate, "yyyy-MM-dd");
    scheduleMap.set(dateKey, schedule);
  }

  // 7. Generate all days in the range (in local timezone)
  const lastMonth = addMonths(localStart, numberOfMonths - 1);
  const daysInRange = eachDayOfInterval({
    start: localStart,
    end: new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      endOfMonth(lastMonth).getDate(),
      23,
      59,
      59,
      999
    ),
  });

  // 8. Build calendar days
  const calendarDays: CalendarDay[] = [];

  for (const localDay of daysInRange) {
    const dateISO = format(localDay, "yyyy-MM-dd");
    const utcDay = fromZonedTime(localDay, clientTimeZone);
    const utcDateISO = utcDay.toISOString();

    // Check if there's a DaySchedule for this local date
    const schedule = scheduleMap.get(dateISO);

    // Determine day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = getDay(localDay);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

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

    // Check if it's a holiday
    const holidayName = holidayMap.get(dateISO);
    const isHoliday = !!holidayName;

    calendarDays.push({
      dateISO,
      utcDateISO,
      isWeekend,
      isHoliday,
      holidayName,
      dayCode,
      status: schedule?.status ?? "AVAILABLE",
      unavailabilityReasonId: schedule?.unavailabilityReasonId ?? null,
      unavailabilityReasonName: schedule?.unavailabilityReason?.name ?? null,
      unavailabilityReasonColor: schedule?.unavailabilityReason?.colorCode ?? null,
      applicationId: schedule?.applicationId ?? null,
    });
  }

  return calendarDays;
}

