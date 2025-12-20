import { addDays, isSameDay } from "./dates";

export type CalendarView = "week" | "month";

/**
 * Get date range for calendar view
 */
export function getDateRange(
  startDate: Date,
  endDate: Date,
  view: CalendarView
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Get week range for a given date
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get month range for a given year and month
 */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, month, 0); // Last day of month
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format date for calendar header
 */
export function formatDateHeader(date: Date): string {
  const day = date.getDate();
  const dayName = date.toLocaleDateString("hr-HR", { weekday: "short" });
  return `${day}\n${dayName}`;
}

/**
 * Format month header
 */
export function formatMonthHeader(date: Date): string {
  return date.toLocaleDateString("hr-HR", { month: "long", year: "numeric" });
}

/**
 * Check if date is in range
 */
export function isDateInRange(
  date: Date,
  start: Date,
  end: Date
): boolean {
  return date >= start && date <= end;
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date: Date): Date {
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of week (Sunday)
 */
export function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: Date): Date {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

