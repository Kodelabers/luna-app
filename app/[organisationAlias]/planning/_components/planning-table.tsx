"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { EmployeeStatus } from "@prisma/client";
import type {
  PlanningData,
  PlanningCell,
  PlanningDay,
  PlanningEmployee,
} from "@/lib/services/planning";
import { PlanningCellDialog } from "./planning-cell-dialog";
import { cn } from "@/lib/utils";

type PlanningTableProps = {
  data: PlanningData;
  organisationAlias: string;
};

// Status color mapping for DaySchedule (background)
// Note: NOT_AVAILABLE uses unavailabilityReasonColor directly (not a fixed color)
const statusColorMap: Record<EmployeeStatus, string> = {
  AVAILABLE: "bg-background",
  NOT_AVAILABLE: "bg-background", // Will be overridden by unavailabilityReasonColor if present
  SELECTED_FOR_DUTY: "bg-blue-100 dark:bg-blue-950",
};

// Layout constants for consistent sizing
const ROW_HEIGHT = "h-10";
const HEADER_HEIGHT = "h-10";
const DAY_COL_WIDTH = "w-[60px] min-w-[60px]";
const EMP_COL_WIDTH = "w-[200px] min-w-[200px]";

export function PlanningTable({ data, organisationAlias }: PlanningTableProps) {
  const t = useTranslations("planning");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const [selectedCell, setSelectedCell] = useState<{
    employee: PlanningEmployee;
    day: PlanningDay;
    cell: PlanningCell;
  } | null>(null);

  const { employees, days, cells } = data;

  // Build cell map for quick lookup
  const cellMap = new Map<string, PlanningCell>();
  for (const cell of cells) {
    const key = `${cell.employeeId}:${cell.dateLocalISO}`;
    cellMap.set(key, cell);
  }

  // Get cell for employee and day
  const getCell = (employeeId: number, dateLocalISO: string): PlanningCell | null => {
    const key = `${employeeId}:${dateLocalISO}`;
    return cellMap.get(key) ?? null;
  };

  // Helper to detect consecutive days (same as "Moj kalendar")
  const isConsecutiveDay = (date1: string, date2: string): boolean => {
    const d1 = parseISO(date1);
    const d2 = parseISO(date2);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return diff === 24 * 60 * 60 * 1000; // 1 day difference
  };

  // Determine position of a day within an application range (same as "Moj kalendar")
  const getApplicationDayPosition = (
    dateLocalISO: string,
    startDateLocalISO: string,
    endDateLocalISO: string,
    allApplicationDays: string[]
  ): "start" | "middle" | "end" | "single" => {
    const sortedDays = [...allApplicationDays].sort((a, b) => a.localeCompare(b));
    const currentIndex = sortedDays.indexOf(dateLocalISO);
    
    if (currentIndex === -1) return "single";
    
    const prevDay = currentIndex > 0 ? sortedDays[currentIndex - 1] : null;
    const nextDay = currentIndex < sortedDays.length - 1 ? sortedDays[currentIndex + 1] : null;
    
    const hasPrev = prevDay && isConsecutiveDay(prevDay, dateLocalISO);
    const hasNext = nextDay && isConsecutiveDay(dateLocalISO, nextDay);
    
    if (hasPrev && hasNext) {
      return "middle";
    } else if (hasPrev && !hasNext) {
      return "end";
    } else if (!hasPrev && hasNext) {
      return "start";
    } else {
      return "single";
    }
  };

  // Determine position of a day within DaySchedule NOT_AVAILABLE range (same as "Moj kalendar")
  const getDaySchedulePosition = (
    employeeId: number,
    dateLocalISO: string,
    unavailabilityReasonId: number | null
  ): "start" | "middle" | "end" | "single" => {
    if (!unavailabilityReasonId) return "single";
    
    // Find all days with the same reason for this employee
    const reasonDays: string[] = [];
    for (const cell of cells) {
      if (
        cell.employeeId === employeeId &&
        cell.daySchedule?.unavailabilityReasonId === unavailabilityReasonId &&
        cell.daySchedule.status === "NOT_AVAILABLE"
      ) {
        reasonDays.push(cell.dateLocalISO);
      }
    }
    
    const sortedDays = [...reasonDays].sort((a, b) => a.localeCompare(b));
    const currentIndex = sortedDays.indexOf(dateLocalISO);
    
    if (currentIndex === -1) return "single";
    
    const prevDay = currentIndex > 0 ? sortedDays[currentIndex - 1] : null;
    const nextDay = currentIndex < sortedDays.length - 1 ? sortedDays[currentIndex + 1] : null;
    
    const hasPrev = prevDay && isConsecutiveDay(prevDay, dateLocalISO);
    const hasNext = nextDay && isConsecutiveDay(dateLocalISO, nextDay);
    
    if (hasPrev && hasNext) {
      return "middle";
    } else if (hasPrev && !hasNext) {
      return "end";
    } else if (!hasPrev && hasNext) {
      return "start";
    } else {
      return "single";
    }
  };

  // Handle cell click
  const handleCellClick = (
    employee: PlanningEmployee,
    day: PlanningDay,
    cell: PlanningCell | null
  ) => {
    if (cell) {
      setSelectedCell({ employee, day, cell });
    }
  };

  if (employees.length === 0 || days.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{t("noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Split layout container: Left (Fixed) + Right (Scrollable) */}
      <div className="flex w-full rounded-md bg-background overflow-hidden">
        
        {/* Left Column: Employees (Fixed) */}
        <div className={cn("flex-none z-20 bg-background shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]", EMP_COL_WIDTH)}>
          {/* Header */}
          <div className={cn(HEADER_HEIGHT, "p-1 flex items-center font-medium")}>
            {t("employee")}
          </div>
          
          {/* Employee Rows */}
          <div className="flex flex-col">
            {employees.map((employee) => (
              <div 
                key={employee.id} 
                className={cn(ROW_HEIGHT, "mt-2 first:mt-0 p-1 flex items-center")}
              >
                <span className="text-sm font-medium truncate" title={`${employee.firstName} ${employee.lastName}`}>
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Calendar Grid (Scrollable) */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max">
            {/* Header Row */}
            <div className={cn("flex", HEADER_HEIGHT)}>
              {days.map((day) => (
                <div
                  key={day.dateLocalISO}
                  className={cn(DAY_COL_WIDTH, "p-1 flex flex-col items-center justify-center text-xs font-medium")}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>
                      {format(parseISO(day.dateLocalISO), "dd.MM.", {
                        locale: dateLocale,
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      {format(parseISO(day.dateLocalISO), "EEE", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Data Rows */}
            <div className="flex flex-col">
              {employees.map((employee) => (
                <div key={employee.id} className={cn("flex mt-2 first:mt-0", ROW_HEIGHT)}>
                  {days.map((day) => {
                    const cell = getCell(employee.id, day.dateLocalISO);
                    
                    // Determine if weekend or holiday
                    const isWeekend = day.isWeekend;
                    const isHoliday = day.isHoliday;

                    // Get applications for this cell
                    const applications = cell?.applications ?? [];

                    // Determine background color based on status/reason (same logic as "Moj kalendar")
                    let bgColor = "bg-background";
                    let textColor = "text-foreground";
                    let customBgColor: string | undefined = undefined;

                    if (isWeekend) {
                      bgColor = "bg-muted";
                      textColor = "text-muted-foreground";
                    }

                    if (isHoliday) {
                      bgColor = "bg-red-100 dark:bg-red-950";
                      textColor = "text-red-900 dark:text-red-100";
                    }

                    // DaySchedule NOT_AVAILABLE with unavailabilityReasonColor
                    let borderRadius: string | undefined = undefined;
                    if (
                      cell?.daySchedule?.unavailabilityReasonColor &&
                      cell.daySchedule.status === "NOT_AVAILABLE"
                    ) {
                      bgColor = ""; // Clear default bg to use custom color
                      textColor = "text-white";
                      customBgColor = cell.daySchedule.unavailabilityReasonColor;
                      
                      const position = getDaySchedulePosition(
                        employee.id,
                        day.dateLocalISO,
                        cell.daySchedule.unavailabilityReasonId
                      );
                      
                      if (position === "start") {
                        borderRadius = "0.375rem 0 0 0.375rem"; // rounded-l-md
                      } else if (position === "middle") {
                        borderRadius = "0";
                      } else if (position === "end") {
                        borderRadius = "0 0.375rem 0.375rem 0"; // rounded-r-md
                      } else {
                        borderRadius = "0.375rem"; // rounded-md
                      }
                    } else if (cell?.daySchedule?.status) {
                      bgColor = statusColorMap[cell.daySchedule.status];
                    }

                    return (
                      <div
                        key={`${employee.id}:${day.dateLocalISO}`}
                        className={cn(
                          DAY_COL_WIDTH,
                          "p-1 flex items-center justify-center relative cursor-pointer hover:ring-2 hover:ring-ring transition-colors",
                          bgColor,
                          textColor
                        )}
                        style={{
                          ...(customBgColor ? { backgroundColor: customBgColor } : {}),
                          ...(borderRadius ? { borderRadius } : {}),
                        }}
                        onClick={() => handleCellClick(employee, day, cell)}
                        title={
                          day.isHoliday
                            ? day.holidayName
                            : cell?.daySchedule?.unavailabilityReasonName ||
                              (applications.length > 0
                                ? applications
                                    .map((a) => a.unavailabilityReasonName)
                                    .join(", ")
                                : undefined)
                        }
                      >
                        {/* Application overlays - use border styling */}
                        {applications.map((app) => {
                          const appColor = app.unavailabilityReasonColor || "#fbbf24";
                          
                          const appDays: string[] = [];
                          const startDate = parseISO(app.startDateLocalISO);
                          const endDate = parseISO(app.endDateLocalISO);
                          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                            appDays.push(format(d, "yyyy-MM-dd"));
                          }
                          
                          const position = getApplicationDayPosition(
                            day.dateLocalISO,
                            app.startDateLocalISO,
                            app.endDateLocalISO,
                            appDays
                          );
                          
                          let borderStyle: React.CSSProperties = {};
                          
                          if (position === "start") {
                            borderStyle = {
                              borderTop: `2px solid ${appColor}`,
                              borderBottom: `2px solid ${appColor}`,
                              borderLeft: `2px solid ${appColor}`,
                              borderRight: "none",
                              borderRadius: "0.375rem 0 0 0.375rem",
                            };
                          } else if (position === "middle") {
                            borderStyle = {
                              borderTop: `2px solid ${appColor}`,
                              borderBottom: `2px solid ${appColor}`,
                              borderLeft: "none",
                              borderRight: "none",
                              borderRadius: "0",
                            };
                          } else if (position === "end") {
                            borderStyle = {
                              borderTop: `2px solid ${appColor}`,
                              borderBottom: `2px solid ${appColor}`,
                              borderLeft: "none",
                              borderRight: `2px solid ${appColor}`,
                              borderRadius: "0 0.375rem 0.375rem 0",
                            };
                          } else {
                            borderStyle = {
                              border: `2px solid ${appColor}`,
                              borderRadius: "0.375rem",
                            };
                          }
                          
                          return (
                            <div
                              key={app.id}
                              className="absolute inset-0 pointer-events-none"
                              style={borderStyle}
                              title={`${app.unavailabilityReasonName} (${app.status})`}
                            />
                          );
                        })}

                        {/* Day number overlay */}
                        <div className="relative z-10 text-xs">
                          {format(parseISO(day.dateLocalISO), "d", {
                            locale: dateLocale,
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border bg-background" />
          <span className="text-muted-foreground">{t("legend.available")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border bg-muted" />
          <span className="text-muted-foreground">{t("legend.weekend")}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border bg-red-100 dark:bg-red-950" />
          <span className="text-muted-foreground">{t("legend.holiday")}</span>
        </div>
        
        {/* Show unique unavailability reasons with their colors */}
        {Array.from(
          new Map(
            [
              ...cells
                .filter(
                  (cell) =>
                    cell.daySchedule?.unavailabilityReasonName &&
                    cell.daySchedule?.unavailabilityReasonColor &&
                    cell.daySchedule.status === "NOT_AVAILABLE"
                )
                .map((cell) => [
                  cell.daySchedule!.unavailabilityReasonId!,
                  {
                    name: cell.daySchedule!.unavailabilityReasonName!,
                    color: cell.daySchedule!.unavailabilityReasonColor!,
                    type: "background" as const,
                  },
                ]),
              ...cells
                .flatMap((cell) => cell.applications)
                .filter(
                  (app) => app.unavailabilityReasonName && app.unavailabilityReasonColor
                )
                .map((app) => [
                  app.unavailabilityReasonId,
                  {
                    name: app.unavailabilityReasonName,
                    color: app.unavailabilityReasonColor!,
                    type: "border" as const,
                  },
                ]),
            ]
          ).values()
        ).map((reason) => (
          <div key={reason.name} className="flex items-center gap-2">
            {reason.type === "background" ? (
              <div
                className="h-4 w-4 rounded border"
                style={{ backgroundColor: reason.color }}
              />
            ) : (
              <div
                className="h-4 w-4 rounded border"
                style={{ border: `2px solid ${reason.color}` }}
              />
            )}
            <span className="text-muted-foreground">{reason.name}</span>
          </div>
        ))}
      </div>

      {/* Cell details dialog */}
      {selectedCell && (
        <PlanningCellDialog
          employee={selectedCell.employee}
          day={selectedCell.day}
          cell={selectedCell.cell}
          open={!!selectedCell}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCell(null);
            }
          }}
          organisationAlias={organisationAlias}
        />
      )}
    </div>
  );
}
