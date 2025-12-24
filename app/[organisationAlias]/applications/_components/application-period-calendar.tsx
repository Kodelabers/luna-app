"use client";

import { Calendar } from "@/components/ui/calendar";
import { eachDayOfInterval, differenceInMonths, startOfMonth } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

type ApplicationPeriodCalendarProps = {
  startDate: Date;
  endDate: Date;
  reasonColor: string | null;
};

export function ApplicationPeriodCalendar({
  startDate,
  endDate,
  reasonColor,
}: ApplicationPeriodCalendarProps) {
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  // Calculate number of months to display
  const startMonth = startOfMonth(startDate);
  const endMonth = startOfMonth(endDate);
  const monthsDiff = differenceInMonths(endMonth, startMonth);
  const numberOfMonths = monthsDiff + 1; // +1 because we include both start and end month

  return (
    <Calendar
      mode="range"
      selected={{
        from: startDate,
        to: endDate,
      }}
      month={startDate}
      locale={dateLocale}
      disabled
      numberOfMonths={numberOfMonths}
      modifiers={{
        selected: eachDayOfInterval({ start: startDate, end: endDate }),
      }}
      modifiersStyles={{
        selected: {
          backgroundColor: reasonColor || "hsl(var(--primary))",
          color: "white",
          borderRadius: "0.375rem",
        },
      }}
      className="rounded-md border"
    />
  );
}

