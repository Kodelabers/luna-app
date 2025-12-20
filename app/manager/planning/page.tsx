"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useMockAuth } from "@/lib/mock-data/context";
import { Card, CardContent } from "@/components/ui/card";
import { PlanningGrid } from "@/components/planning/planning-grid";
import { CalendarControls } from "@/components/planning/calendar-controls";
import { CalendarLegend } from "@/components/planning/calendar-legend";
import { useMockApplications } from "@/lib/mock-data/api";
import {
  mockEmployees,
  mockHolidays,
} from "@/lib/mock-data/generator";
import { CalendarView, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } from "@/lib/utils/calendar";

export default function PlanningPage() {
  const { currentUser } = useMockAuth();
  const { applications } = useMockApplications();

  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range based on view
  const { startDate, endDate } = useMemo(() => {
    if (view === "week") {
      const start = getStartOfWeek(currentDate);
      const end = getEndOfWeek(currentDate);
      return { startDate: start, endDate: end };
    } else {
      const start = getStartOfMonth(currentDate);
      const end = getEndOfMonth(currentDate);
      return { startDate: start, endDate: end };
    }
  }, [view, currentDate]);

  const handleRangeChange = (start: Date, end: Date) => {
    // Range is automatically calculated, but we can use this for future enhancements
  };

  if (!currentUser || !currentUser.departmentId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Niste povezani s odjelom
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter employees by department
  const departmentEmployees = mockEmployees.filter(
    (emp) => emp.departmentId === currentUser.departmentId && emp.active
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Planiranje</h1>
          <p className="text-muted-foreground">
            Tablični prikaz nedostupnosti zaposlenika
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <CalendarControls
              view={view}
              currentDate={currentDate}
              onViewChange={setView}
              onDateChange={setCurrentDate}
              onRangeChange={handleRangeChange}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[calc(100vh-300px)]">
                  <PlanningGrid
                    employees={departmentEmployees}
                    applications={applications}
                    holidays={mockHolidays}
                    startDate={startDate}
                    endDate={endDate}
                    departmentId={currentUser.departmentId}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <CalendarLegend />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

