import {
  Application,
  ApplicationStatus,
  Holiday,
  Employee,
} from "@/lib/types";
import { isWeekend, isSameDay, isDateInRange } from "./dates";
import { CellStatus } from "./colors";

export interface CellData {
  status: CellStatus;
  application?: Application;
  isWeekend: boolean;
  isHoliday: boolean;
  isCritical: boolean;
}

export interface CriticalPeriod {
  startDate: Date;
  endDate: Date;
  affectedEmployees: number;
  threshold: number;
}

/**
 * Get cell status for a specific employee and date
 */
export function getCellStatus(
  employeeId: number,
  date: Date,
  applications: Application[],
  holidays: Holiday[] = []
): CellData {
  const isWeekendDay = isWeekend(date);
  const isHolidayDay = holidays.some((holiday) => {
    const holidayDate = new Date(holiday.date);
    return (
      isSameDay(holidayDate, date) ||
      (holiday.repeatYearly &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getDate() === date.getDate())
    );
  });

  // Find application that covers this date
  const application = applications.find((app) => {
    if (app.employeeId !== employeeId || !app.active) {
      return false;
    }

    const appStart = new Date(app.startDate);
    const appEnd = new Date(app.endDate);
    appStart.setHours(0, 0, 0, 0);
    appEnd.setHours(23, 59, 59, 999);

    return isDateInRange(date, appStart, appEnd);
  });

  if (!application) {
    return {
      status: CellStatus.AVAILABLE,
      isWeekend: isWeekendDay,
      isHoliday: isHolidayDay,
      isCritical: false,
    };
  }

  // Determine status based on application
  let status: CellStatus;
  if (application.unavailabilityReasonId === 2) {
    // Bolovanje (id: 2)
    status = CellStatus.SICK_LEAVE;
  } else if (
    application.status === ApplicationStatus.APPROVED
  ) {
    status = CellStatus.APPROVED;
  } else if (
    application.status === ApplicationStatus.SUBMITTED ||
    application.status === ApplicationStatus.APPROVED_FIRST_LEVEL
  ) {
    status = CellStatus.PENDING;
  } else {
    status = CellStatus.AVAILABLE;
  }

  return {
    status,
    application,
    isWeekend: isWeekendDay,
    isHoliday: isHolidayDay,
    isCritical: false, // Will be set by findCriticalPeriods
  };
}

/**
 * Get tooltip text for a cell
 */
export function getCellTooltip(
  employeeId: number,
  date: Date,
  applications: Application[],
  employees: Employee[],
  holidays: Holiday[] = []
): string {
  const cellData = getCellStatus(employeeId, date, applications, holidays);
  const employee = employees.find((e) => e.id === employeeId);

  if (cellData.isWeekend) {
    return `Vikend - ${employee?.firstName} ${employee?.lastName}`;
  }

  if (cellData.isHoliday) {
    const holiday = holidays.find((h) => {
      const holidayDate = new Date(h.date);
      return isSameDay(holidayDate, date);
    });
    return `${holiday?.name || "Praznik"} - ${employee?.firstName} ${employee?.lastName}`;
  }

  if (cellData.application) {
    const reason = cellData.application.unavailabilityReasonId === 2
      ? "Bolovanje"
      : "Godišnji odmor";
    return `${reason} - ${employee?.firstName} ${employee?.lastName}`;
  }

  return `Dostupno - ${employee?.firstName} ${employee?.lastName}`;
}

/**
 * Find critical periods where too many employees are absent
 */
export function findCriticalPeriods(
  applications: Application[],
  employees: Employee[],
  startDate: Date,
  endDate: Date,
  threshold: number = 3 // Default: critical if 3+ employees absent
): CriticalPeriod[] {
  const criticalPeriods: CriticalPeriod[] = [];
  const dateMap = new Map<string, number>(); // date string -> count of absent employees

  // Count absent employees per date
  applications
    .filter(
      (app) =>
        app.active &&
        (app.status === ApplicationStatus.APPROVED ||
          app.status === ApplicationStatus.SUBMITTED ||
          app.status === ApplicationStatus.APPROVED_FIRST_LEVEL)
    )
    .forEach((app) => {
      const appStart = new Date(app.startDate);
      const appEnd = new Date(app.endDate);
      let currentDate = new Date(appStart);

      while (currentDate <= appEnd) {
        if (currentDate >= startDate && currentDate <= endDate) {
          const dateKey = currentDate.toISOString().split("T")[0];
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

  // Find consecutive dates with threshold exceeded
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;

  const sortedDates = Array.from(dateMap.entries())
    .filter(([_, count]) => count >= threshold)
    .map(([dateStr, _]) => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());

  for (const date of sortedDates) {
    if (!periodStart) {
      periodStart = new Date(date);
      periodEnd = new Date(date);
    } else if (
      periodEnd &&
      date.getTime() - periodEnd.getTime() <= 86400000 // 1 day
    ) {
      periodEnd = new Date(date);
    } else {
      if (periodStart && periodEnd) {
        criticalPeriods.push({
          startDate: periodStart,
          endDate: periodEnd,
          affectedEmployees: Math.max(
            ...Array.from(
              { length: Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1 },
              (_, i) => {
                const checkDate = new Date(periodStart);
                checkDate.setDate(periodStart.getDate() + i);
                return dateMap.get(checkDate.toISOString().split("T")[0]) || 0;
              }
            )
          ),
          threshold,
        });
      }
      periodStart = new Date(date);
      periodEnd = new Date(date);
    }
  }

  // Add last period
  if (periodStart && periodEnd) {
    criticalPeriods.push({
      startDate: periodStart,
      endDate: periodEnd,
      affectedEmployees: Math.max(
        ...Array.from(
          { length: Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1 },
          (_, i) => {
            const checkDate = new Date(periodStart);
            checkDate.setDate(periodStart.getDate() + i);
            return dateMap.get(checkDate.toISOString().split("T")[0]) || 0;
          }
        )
      ),
      threshold,
    });
  }

  return criticalPeriods;
}

/**
 * Mark critical cells in cell data
 */
export function markCriticalCells(
  cellData: CellData,
  date: Date,
  criticalPeriods: CriticalPeriod[]
): CellData {
  const isCritical = criticalPeriods.some((period) =>
    isDateInRange(date, period.startDate, period.endDate)
  );

  return {
    ...cellData,
    isCritical,
    status: isCritical ? CellStatus.CRITICAL : cellData.status,
  };
}

