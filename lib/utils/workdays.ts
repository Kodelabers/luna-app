import { Holiday } from "@/lib/types";
import { isWeekend, generateDateRange } from "./dates";

export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  return holidays.some((holiday) => {
    const holidayDate = new Date(holiday.date);
    return (
      holidayDate.getDate() === date.getDate() &&
      holidayDate.getMonth() === date.getMonth() &&
      (holiday.repeatYearly || holidayDate.getFullYear() === date.getFullYear())
    );
  });
}

export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  holidays: Holiday[]
): number {
  const dates = generateDateRange(startDate, endDate);
  
  let workingDays = 0;
  for (const date of dates) {
    if (!isWeekend(date) && !isHoliday(date, holidays)) {
      workingDays++;
    }
  }
  
  return workingDays;
}

export function getNextWorkingDay(date: Date, holidays: Holiday[]): Date {
  let nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  
  while (isWeekend(nextDate) || isHoliday(nextDate, holidays)) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

export function getPreviousWorkingDay(date: Date, holidays: Holiday[]): Date {
  let prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  
  while (isWeekend(prevDate) || isHoliday(prevDate, holidays)) {
    prevDate.setDate(prevDate.getDate() - 1);
  }
  
  return prevDate;
}

export function isWorkingDay(date: Date, holidays: Holiday[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

