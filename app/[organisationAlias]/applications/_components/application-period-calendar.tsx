"use client";

import { Calendar } from "@/components/ui/calendar";
import { eachDayOfInterval, differenceInMonths, startOfMonth } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import type { DateRange } from "react-day-picker";

type ApplicationPeriodCalendarProps = {
  startDate: Date;
  endDate: Date;
  reasonColor: string | null;
  /** When true (default), calendar is disabled and only displays the period. When false, user can select a new range. */
  readOnly?: boolean;
  /** Called when user selects a new range. Only used when readOnly is false. */
  onRangeChange?: (from: Date, to: Date) => void;
};

export function ApplicationPeriodCalendar({
  startDate,
  endDate,
  reasonColor,
  readOnly = true,
  onRangeChange,
}: ApplicationPeriodCalendarProps) {
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  // Calculate number of months to display
  const startMonth = startOfMonth(startDate);
  const endMonth = startOfMonth(endDate);
  const monthsDiff = differenceInMonths(endMonth, startMonth);
  const numberOfMonths = monthsDiff + 1; // +1 because we include both start and end month

  const selected: DateRange = { from: startDate, to: endDate };

  const handleSelect = (range: DateRange | undefined) => {
    if (readOnly || !onRangeChange) return;
    if (range?.from && range?.to) {
      onRangeChange(range.from, range.to);
    }
  };

  return (
    <Calendar
      mode="range"
      selected={selected}
      onSelect={handleSelect}
      month={startDate}
      locale={dateLocale}
      disabled={readOnly}
      numberOfMonths={numberOfMonths}
      modifiers={
        readOnly
          ? {
              selected: eachDayOfInterval({ start: startDate, end: endDate }),
            }
          : undefined
      }
      modifiersStyles={
        readOnly
          ? {
              selected: {
                backgroundColor: reasonColor || "hsl(var(--primary))",
                color: "white",
                borderRadius: "0.375rem",
              },
            }
          : undefined
      }
      className="rounded-md border"
    />
  );
}

