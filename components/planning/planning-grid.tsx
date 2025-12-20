"use client";

import { useMemo, useState } from "react";
import { Application, Employee, Holiday } from "@/lib/types";
import { getDateRange } from "@/lib/utils/calendar";
import {
  getCellStatus,
  getCellTooltip,
  findCriticalPeriods,
  markCriticalCells,
  CellData,
} from "@/lib/utils/planning";
import {
  CellStatus,
  getCellColor,
  getCellHoverColor,
  getCellTextColor,
} from "@/lib/utils/colors";
import { isWeekend } from "@/lib/utils/dates";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateRange } from "@/lib/utils/dates";
import { mockUnavailabilityReasons } from "@/lib/mock-data/generator";

interface PlanningGridProps {
  employees: Employee[];
  applications: Application[];
  holidays: Holiday[];
  startDate: Date;
  endDate: Date;
  departmentId?: number;
}

export function PlanningGrid({
  employees,
  applications,
  holidays,
  startDate,
  endDate,
  departmentId,
}: PlanningGridProps) {
  const [selectedCell, setSelectedCell] = useState<{
    employeeId: number;
    date: Date;
  } | null>(null);

  // Filter employees by department if provided
  const filteredEmployees = useMemo(() => {
    if (!departmentId) return employees;
    return employees.filter((emp) => emp.departmentId === departmentId);
  }, [employees, departmentId]);

  // Get date range
  const dates = useMemo(() => {
    return getDateRange(startDate, endDate, "month");
  }, [startDate, endDate]);

  // Find critical periods
  const criticalPeriods = useMemo(() => {
    return findCriticalPeriods(
      applications,
      filteredEmployees,
      startDate,
      endDate,
      3 // Threshold: 3+ employees absent
    );
  }, [applications, filteredEmployees, startDate, endDate]);

  // Get cell data for a specific employee and date
  const getCellData = (employeeId: number, date: Date): CellData => {
    const cellData = getCellStatus(employeeId, date, applications, holidays);
    return markCriticalCells(cellData, date, criticalPeriods);
  };

  // Get selected cell application
  const selectedApplication = selectedCell
    ? applications.find((app) => {
        if (app.employeeId !== selectedCell.employeeId || !app.active) {
          return false;
        }
        const appStart = new Date(app.startDate);
        const appEnd = new Date(app.endDate);
        return (
          selectedCell.date >= appStart && selectedCell.date <= appEnd
        );
      })
    : null;

  const selectedEmployee = selectedCell
    ? filteredEmployees.find((e) => e.id === selectedCell.employeeId)
    : null;

  const selectedReason = selectedApplication
    ? mockUnavailabilityReasons.find(
        (r) => r.id === selectedApplication.unavailabilityReasonId
      )
    : null;

  return (
    <div className="w-full overflow-auto">
      <TooltipProvider>
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-background border border-border p-2 text-left font-medium min-w-[200px]">
                  Zaposlenik
                </th>
                {dates.map((date) => (
                  <th
                    key={date.toISOString()}
                    className="border border-border p-2 text-center font-medium min-w-[80px] bg-background"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold">
                        {date.getDate()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("hr-HR", { weekday: "short" })}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="sticky left-0 z-10 bg-background border border-border p-2 font-medium">
                    <div>
                      <div className="font-semibold">
                        {employee.firstName} {employee.lastName}
                      </div>
                      {employee.title && (
                        <div className="text-xs text-muted-foreground">
                          {employee.title}
                        </div>
                      )}
                    </div>
                  </td>
                  {dates.map((date) => {
                    const cellData = getCellData(employee.id, date);
                    const tooltip = getCellTooltip(
                      employee.id,
                      date,
                      applications,
                      filteredEmployees,
                      holidays
                    );

                    return (
                      <Tooltip key={date.toISOString()}>
                        <TooltipTrigger asChild>
                          <td
                            className={`
                              border border-border p-1 text-center cursor-pointer
                              ${getCellColor(cellData.status)}
                              ${getCellHoverColor(cellData.status)}
                              ${getCellTextColor(cellData.status)}
                              ${cellData.isWeekend ? "opacity-60" : ""}
                              ${cellData.isHoliday ? "opacity-70" : ""}
                              transition-colors
                            `}
                            onClick={() =>
                              setSelectedCell({
                                employeeId: employee.id,
                                date,
                              })
                            }
                          >
                            <div className="w-full h-8 flex items-center justify-center">
                              {cellData.status !== CellStatus.AVAILABLE && (
                                <div className="w-2 h-2 rounded-full bg-current opacity-80" />
                              )}
                            </div>
                          </td>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

      {/* Cell Detail Dialog */}
      <Dialog
        open={!!selectedCell}
        onOpenChange={() => setSelectedCell(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalji</DialogTitle>
            <DialogDescription>
              {selectedEmployee &&
                `${selectedEmployee.firstName} ${selectedEmployee.lastName} - ${selectedCell?.date.toLocaleDateString("hr-HR")}`}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && selectedReason ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Tip Nedostupnosti</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReason.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Razdoblje</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(
                    selectedApplication.startDate,
                    selectedApplication.endDate
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication.status}
                </p>
              </div>
              {selectedApplication.description && (
                <div>
                  <p className="text-sm font-medium">Napomena</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedCell?.date && isWeekend(selectedCell.date)
                  ? "Vikend"
                  : "Dostupno"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

