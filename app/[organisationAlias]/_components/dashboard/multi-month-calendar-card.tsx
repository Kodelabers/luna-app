"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarDay } from "@/lib/services/calendar";
import { parseISO } from "date-fns";

type MultiMonthCalendarCardProps = {
  calendarDays: CalendarDay[];
  month: number;
  year: number;
};

export function MultiMonthCalendarCard({
  calendarDays,
  month,
  year,
}: MultiMonthCalendarCardProps) {
  const t = useTranslations("dashboard");
  const [numberOfMonths, setNumberOfMonths] = useState(3);

  // Create a map of dates to calendar day data for quick lookup
  const calendarMap = new Map<string, CalendarDay>();
  calendarDays.forEach((day) => {
    calendarMap.set(day.dateISO, day);
  });

  // Create modifiers and styles for each unavailability reason
  const modifiers: Record<string, Date[]> = {};
  const modifiersStyles: Record<string, React.CSSProperties> = {};
  const modifiersClassNames: Record<string, string> = {};

  // Helper to detect consecutive days
  const isConsecutiveDay = (date1: string, date2: string): boolean => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return diff === 24 * 60 * 60 * 1000; // 1 day difference
  };

  // Group days by unavailability reason and detect ranges
  const reasonGroups = new Map<string, { dates: Date[]; ranges: Map<string, 'start' | 'middle' | 'end' | 'single'> }>();
  
  // First pass: group by reason
  calendarDays.forEach((day) => {
    if (day.status === "NOT_AVAILABLE" && day.unavailabilityReasonColor) {
      const key = `reason_${day.unavailabilityReasonId}`;
      if (!reasonGroups.has(key)) {
        reasonGroups.set(key, { dates: [], ranges: new Map() });
      }
      reasonGroups.get(key)!.dates.push(parseISO(day.dateISO));
    }
  });

  // Second pass: detect consecutive ranges for each reason
  reasonGroups.forEach((group, key) => {
    const sortedDays = calendarDays
      .filter(d => d.status === "NOT_AVAILABLE" && d.unavailabilityReasonId?.toString() === key.replace('reason_', ''))
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

    sortedDays.forEach((day, index) => {
      const prevDay = index > 0 ? sortedDays[index - 1] : null;
      const nextDay = index < sortedDays.length - 1 ? sortedDays[index + 1] : null;

      const hasPrev = prevDay && isConsecutiveDay(prevDay.dateISO, day.dateISO);
      const hasNext = nextDay && isConsecutiveDay(day.dateISO, nextDay.dateISO);

      if (hasPrev && hasNext) {
        group.ranges.set(day.dateISO, 'middle');
      } else if (hasPrev && !hasNext) {
        group.ranges.set(day.dateISO, 'end');
      } else if (!hasPrev && hasNext) {
        group.ranges.set(day.dateISO, 'start');
      } else {
        group.ranges.set(day.dateISO, 'single');
      }
    });
  });

  // Create modifiers for each day with appropriate styling
  reasonGroups.forEach((group, key) => {
    const reasonColor = calendarDays.find(d => 
      d.status === "NOT_AVAILABLE" && 
      d.unavailabilityReasonId?.toString() === key.replace('reason_', '')
    )?.unavailabilityReasonColor;

    group.ranges.forEach((position, dateISO) => {
      const modifierKey = `${key}_${position}`;
      const date = parseISO(dateISO);

      if (!modifiers[modifierKey]) {
        modifiers[modifierKey] = [];
        
        let borderRadius = '0.375rem'; // default rounded-md
        if (position === 'start') {
          borderRadius = '0.375rem 0 0 0.375rem'; // rounded-l-md
        } else if (position === 'middle') {
          borderRadius = '0';
        } else if (position === 'end') {
          borderRadius = '0 0.375rem 0.375rem 0'; // rounded-r-md
        }

        modifiersStyles[modifierKey] = {
          boxShadow: `inset 0 0 0 2px ${reasonColor}`,
          backgroundColor: reasonColor || undefined,
          color: "white",
          fontWeight: "600",
          borderRadius,
        };
      }
      modifiers[modifierKey].push(date);
    });
  });

  // Add holiday and weekend modifiers
  modifiers.holiday = calendarDays
    .filter((day) => day.isHoliday)
    .map((day) => parseISO(day.dateISO));
  
  modifiersStyles.holiday = {
    boxShadow: "inset 0 0 0 2px #fecaca",
    backgroundColor: "#fecaca",
  };
  modifiersClassNames.holiday = "text-red-900 dark:text-red-100 font-semibold";

  modifiers.weekend = calendarDays
    .filter((day) => day.isWeekend && day.status === "AVAILABLE")
    .map((day) => parseISO(day.dateISO));
  
  modifiersStyles.weekend = {
    boxShadow: "inset 0 0 0 2px hsl(var(--muted))",
    backgroundColor: "hsl(var(--muted))",
  };
  modifiersClassNames.weekend = "text-muted-foreground";

  const monthOptions = [
    { value: 3, label: t("threeMonths") },
    { value: 6, label: t("sixMonths") },
    { value: 9, label: t("nineMonths") },
    { value: 12, label: t("twelveMonths") },
  ];

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("myCalendar")}</CardTitle>
            <CardDescription>{t("scheduleForCurrentMonth")}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {monthOptions.map((option) => (
              <Button
                key={option.value}
                variant={numberOfMonths === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setNumberOfMonths(option.value)}
                className="flex-1 sm:flex-none"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              defaultMonth={new Date(year, month - 1, 1)}
              numberOfMonths={numberOfMonths}
              className="rounded-lg"
              showOutsideDays={false}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              modifiersClassNames={modifiersClassNames}
              classNames={{
                months: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-medium",
                nav: "hidden",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                  "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                day_range_end: "day-range-end",
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-bold ring-2 ring-primary ring-offset-2",
                day_outside: "hidden",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle:
                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 border-t pt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border bg-background" />
              <span className="text-muted-foreground">Radni dan</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border bg-muted" />
              <span className="text-muted-foreground">Vikend</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border bg-red-100 dark:bg-red-950" />
              <span className="text-muted-foreground">Praznik</span>
            </div>
            {/* Show unique unavailability reasons with their colors */}
            {Array.from(
              new Map(
                calendarDays
                  .filter((day) => day.unavailabilityReasonName && day.unavailabilityReasonColor)
                  .map((day) => [
                    day.unavailabilityReasonId,
                    {
                      name: day.unavailabilityReasonName!,
                      color: day.unavailabilityReasonColor!,
                    },
                  ])
              ).values()
            ).map((reason) => (
              <div key={reason.name} className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded border"
                  style={{ backgroundColor: reason.color }}
                />
                <span className="text-muted-foreground">{reason.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

