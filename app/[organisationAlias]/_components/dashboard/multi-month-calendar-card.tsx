"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarDay } from "@/lib/services/calendar";
import { ApplicationSummary } from "@/lib/services/dashboard";
import { parseISO, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { hr, enUS } from "date-fns/locale";

type MultiMonthCalendarCardProps = {
  calendarDays: CalendarDay[];
  month: number;
  year: number;
  pendingApplications?: ApplicationSummary[];
  clientTimeZone?: string;
};

export function MultiMonthCalendarCard({
  calendarDays,
  month,
  year,
  pendingApplications = [],
  clientTimeZone = "Europe/Zagreb",
}: MultiMonthCalendarCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  
  const [numberOfMonths, setNumberOfMonths] = useState(3);
  const [startMonth, setStartMonth] = useState(month);
  const [startYear, setStartYear] = useState(year);

  const goToPreviousMonth = () => {
    if (startMonth === 1) {
      setStartMonth(12);
      setStartYear(startYear - 1);
    } else {
      setStartMonth(startMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (startMonth === 12) {
      setStartMonth(1);
      setStartYear(startYear + 1);
    } else {
      setStartMonth(startMonth + 1);
    }
  };

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

  // Add pending applications with border styling
  // Create a set of approved dates (NOT_AVAILABLE) for filtering
  const approvedDates = new Set<string>();
  calendarDays
    .filter((day) => day.status === "NOT_AVAILABLE")
    .forEach((day) => {
      approvedDates.add(day.dateISO);
    });

  // Group pending days by application and color, excluding already approved days
  const pendingAppsByColor = new Map<string, { color: string; dates: Date[]; dateISOs: string[]; ranges: Map<string, 'start' | 'middle' | 'end' | 'single'> }>();
  
  pendingApplications.forEach((app) => {
    const color = app.unavailabilityReasonColor || "#fbbf24"; // default to warning color
    const key = `pending_${app.id}`;
    
    if (!pendingAppsByColor.has(key)) {
      pendingAppsByColor.set(key, { color, dates: [], dateISOs: [], ranges: new Map() });
    }
    
    // Convert UTC dates to local timezone dates
    const startUtc = parseISO(app.startDate);
    const endUtc = parseISO(app.endDate);
    const startLocal = toZonedTime(startUtc, clientTimeZone);
    const endLocal = toZonedTime(endUtc, clientTimeZone);
    
    // Generate all days in the range, excluding already approved days
    const appDates: Date[] = [];
    const appDateISOs: string[] = [];
    for (let d = new Date(startLocal); d <= endLocal; d.setDate(d.getDate() + 1)) {
      const dateISO = format(d, "yyyy-MM-dd");
      // Only add if not already approved
      if (!approvedDates.has(dateISO)) {
        appDates.push(new Date(d));
        appDateISOs.push(dateISO);
      }
    }
    
    if (appDates.length > 0) {
      const group = pendingAppsByColor.get(key)!;
      group.dates = appDates;
      group.dateISOs = appDateISOs;
      
      // Detect consecutive ranges for this application
      appDateISOs.forEach((dateISO, index) => {
        const prevDateISO = index > 0 ? appDateISOs[index - 1] : null;
        const nextDateISO = index < appDateISOs.length - 1 ? appDateISOs[index + 1] : null;
        
        const hasPrev = prevDateISO && isConsecutiveDay(prevDateISO, dateISO);
        const hasNext = nextDateISO && isConsecutiveDay(dateISO, nextDateISO);
        
        if (hasPrev && hasNext) {
          group.ranges.set(dateISO, 'middle');
        } else if (hasPrev && !hasNext) {
          group.ranges.set(dateISO, 'end');
        } else if (!hasPrev && hasNext) {
          group.ranges.set(dateISO, 'start');
        } else {
          group.ranges.set(dateISO, 'single');
        }
      });
    }
  });

  // Create modifiers for pending applications with range-aware border styling
  let pendingIndex = 0;
  pendingAppsByColor.forEach((group) => {
    if (group.dates.length > 0) {
      const color = group.color;
      
      group.ranges.forEach((position, dateISO) => {
        const date = parseISO(dateISO);
        const modifierKey = `pending-${pendingIndex}-${position}`;
        
        if (!modifiers[modifierKey]) {
          modifiers[modifierKey] = [];
          
          // Determine border style based on position
          let borderStyle: React.CSSProperties = {
            borderRadius: "0.375rem",
          };
          
          if (position === 'start') {
            // Start: no right border
            borderStyle = {
              borderTop: `2px solid ${color}`,
              borderBottom: `2px solid ${color}`,
              borderLeft: `2px solid ${color}`,
              borderRight: 'none',
              borderRadius: "0.375rem 0 0 0.375rem",
            };
          } else if (position === 'middle') {
            // Middle: no side borders
            borderStyle = {
              borderTop: `2px solid ${color}`,
              borderBottom: `2px solid ${color}`,
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: "0",
            };
          } else if (position === 'end') {
            // End: no left border
            borderStyle = {
              borderTop: `2px solid ${color}`,
              borderBottom: `2px solid ${color}`,
              borderLeft: 'none',
              borderRight: `2px solid ${color}`,
              borderRadius: "0 0.375rem 0.375rem 0",
            };
          } else {
            // Single: all borders
            borderStyle = {
              border: `2px solid ${color}`,
              borderRadius: "0.375rem",
            };
          }
          
          modifiersStyles[modifierKey] = borderStyle;
        }
        
        modifiers[modifierKey].push(date);
      });
      
      pendingIndex++;
    }
  });

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
          <Select
            value={numberOfMonths.toString()}
            onValueChange={(v) => setNumberOfMonths(Number(v))}
          >
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t("previousMonth")}</span>
            </Button>
            <div className="flex-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
              <Calendar
                mode="single"
                month={new Date(startYear, startMonth - 1, 1)}
                onMonthChange={(date) => {
                  setStartMonth(date.getMonth() + 1);
                  setStartYear(date.getFullYear());
                }}
                numberOfMonths={numberOfMonths}
                locale={dateLocale}
                className="rounded-lg"
                showOutsideDays={false}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                modifiersClassNames={modifiersClassNames}
                classNames={{
                  months: "flex flex-nowrap gap-6",
                  month: "space-y-4 shrink-0",
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
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">{t("nextMonth")}</span>
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 border-t pt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border bg-background" />
              <span className="text-muted-foreground">{t("legend.workday")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border bg-muted" />
              <span className="text-muted-foreground">{t("legend.weekend")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border bg-red-100 dark:bg-red-950" />
              <span className="text-muted-foreground">{t("legend.holiday")}</span>
            </div>
            {/* Show unique unavailability reasons with their colors (approved) */}
            {Array.from(
              new Map(
                calendarDays
                  .filter((day) => day.unavailabilityReasonName && day.unavailabilityReasonColor && day.status === "NOT_AVAILABLE")
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
                <span className="text-muted-foreground">{reason.name} ({t("legend.approved")})</span>
              </div>
            ))}
            {/* Show pending applications with border styling */}
            {Array.from(
              new Map(
                pendingApplications
                  .filter((app) => app.unavailabilityReasonColor)
                  .map((app) => [
                    app.unavailabilityReasonId,
                    {
                      name: app.unavailabilityReasonName,
                      color: app.unavailabilityReasonColor!,
                    },
                  ])
              ).values()
            ).map((reason) => (
              <div key={`pending-${reason.name}`} className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded border-2"
                  style={{ borderColor: reason.color, backgroundColor: "transparent" }}
                />
                <span className="text-muted-foreground">{reason.name} ({t("legend.pending")})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

