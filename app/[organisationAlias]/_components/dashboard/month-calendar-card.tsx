"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDay } from "@/lib/services/calendar";
import { format, parseISO } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

type MonthCalendarCardProps = {
  calendarDays: CalendarDay[];
  month: number;
  year: number;
};

export function MonthCalendarCard({ calendarDays, month, year }: MonthCalendarCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  // Group days by week
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Pad start of month to align with week start (Monday = 0)
  const firstDay = calendarDays[0];
  if (firstDay) {
    const firstDate = parseISO(firstDay.dateISO);
    const dayOfWeek = firstDate.getDay(); // 0 = Sunday
    const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0

    for (let i = 0; i < paddingDays; i++) {
      currentWeek.push(null as unknown as CalendarDay);
    }
  }

  // Add all days
  for (const day of calendarDays) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad end of month
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null as unknown as CalendarDay);
    }
    weeks.push(currentWeek);
  }

  const monthName = format(new Date(year, month - 1, 1), "MMMM yyyy.", { locale: dateLocale });

  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>{t("myCalendar")}</CardTitle>
        <CardDescription>{monthName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            <div>{t("dayHeaders.mon")}</div>
            <div>{t("dayHeaders.tue")}</div>
            <div>{t("dayHeaders.wed")}</div>
            <div>{t("dayHeaders.thu")}</div>
            <div>{t("dayHeaders.fri")}</div>
            <div>{t("dayHeaders.sat")}</div>
            <div>{t("dayHeaders.sun")}</div>
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIdx) => {
                  if (!day) {
                    return <div key={dayIdx} className="aspect-square" />;
                  }

                  const date = parseISO(day.dateISO);
                  const dayNumber = date.getDate();

                  // Determine background color based on status/reason
                  let bgColor = "bg-background";
                  let textColor = "text-foreground";

                  if (day.isWeekend) {
                    bgColor = "bg-muted";
                    textColor = "text-muted-foreground";
                  }

                  if (day.isHoliday) {
                    bgColor = "bg-red-100 dark:bg-red-950";
                    textColor = "text-red-900 dark:text-red-100";
                  }

                  if (day.unavailabilityReasonColor && day.status === "NOT_AVAILABLE") {
                    bgColor = "";
                    textColor = "text-white";
                  }

                  return (
                    <div
                      key={dayIdx}
                      className={`relative aspect-square rounded-md border p-1 text-center text-xs ${bgColor} ${textColor}`}
                      style={
                        day.unavailabilityReasonColor && day.status === "NOT_AVAILABLE"
                          ? { backgroundColor: day.unavailabilityReasonColor }
                          : undefined
                      }
                      title={
                        day.isHoliday
                          ? day.holidayName
                          : day.unavailabilityReasonName || undefined
                      }
                    >
                      <div className="font-medium">{dayNumber}</div>
                      {day.unavailabilityReasonName && (
                        <div className="mt-0.5 truncate text-[10px] opacity-90">
                          {day.unavailabilityReasonName.substring(0, 3)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

