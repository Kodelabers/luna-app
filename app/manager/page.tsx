"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useMockAuth } from "@/lib/mock-data/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  mockEmployees,
  mockDepartments,
  mockUnavailabilityReasons,
} from "@/lib/mock-data/generator";
import { useMockApplications } from "@/lib/mock-data/api";
import { ApplicationStatus } from "@/lib/types";
import Link from "next/link";
import { Users, FileText, Clock, Calendar } from "lucide-react";
import { formatDateRange } from "@/lib/utils/dates";

export default function ManagerDashboard() {
  const { currentUser } = useMockAuth();
  const { applications } = useMockApplications();

  if (!currentUser || !currentUser.departmentId) return null;

  const department = mockDepartments.find((d) => d.id === currentUser.departmentId);
  const departmentEmployees = mockEmployees.filter(
    (e) => e.departmentId === currentUser.departmentId && e.active
  );

  const pendingApplications = applications.filter(
    (app) =>
      app.departmentId === currentUser.departmentId &&
      (app.status === ApplicationStatus.SUBMITTED ||
        app.status === ApplicationStatus.APPROVED_FIRST_LEVEL)
  );

  const approvedThisMonth = applications.filter((app) => {
    if (
      app.departmentId !== currentUser.departmentId ||
      app.status !== ApplicationStatus.APPROVED
    )
      return false;
    const now = new Date();
    const start = new Date(app.startDate);
    return (
      start.getMonth() === now.getMonth() &&
      start.getFullYear() === now.getFullYear()
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <Badge className="bg-yellow-500">Na čekanju</Badge>;
      case "APPROVED_FIRST_LEVEL":
        return <Badge className="bg-blue-500">Prvi nivo odobren</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Pregled odjela: <span className="font-medium">{department?.name}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zaposlenici</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentEmployees.length}</div>
              <p className="text-xs text-muted-foreground">Aktivnih u odjelu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Na čekanju</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-xs text-muted-foreground">Zahtjevi za odobrenje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Odobreno</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedThisMonth.length}</div>
              <p className="text-xs text-muted-foreground">Ovaj mjesec</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planiranje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/manager/planning">
                <Button variant="outline" size="sm" className="w-full">
                  Otvori Kalendar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Zahtjevi na Čekanju</CardTitle>
            <Link href="/manager/requests">
              <Button variant="outline" size="sm">
                Svi zahtjevi
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingApplications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nema zahtjeva na čekanju
              </p>
            ) : (
              <div className="space-y-4">
                {pendingApplications.slice(0, 5).map((app) => {
                  const employee = mockEmployees.find((e) => e.id === app.employeeId);
                  const reason = mockUnavailabilityReasons.find(
                    (r) => r.id === app.unavailabilityReasonId
                  );
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {employee?.firstName} {employee?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {reason?.name} - {formatDateRange(app.startDate, app.endDate)} (
                          {app.requestedWorkdays} dana)
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(app.status)}
                        <Link href="/manager/requests">
                          <Button size="sm">Pregledaj</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

