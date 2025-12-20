"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useMockAuth } from "@/lib/mock-data/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Clock, CheckCircle2 } from "lucide-react";
import {
  mockApplications,
  mockLedgerEntries,
  mockUnavailabilityReasons,
} from "@/lib/mock-data/generator";
import Link from "next/link";
import { formatDateRange } from "@/lib/utils/dates";

export default function EmployeeDashboard() {
  const { currentUser } = useMockAuth();

  if (!currentUser) return null;

  // Get employee applications
  const employeeApplications = mockApplications.filter(
    (app) => app.employeeId === currentUser.employeeId
  );

  // Get employee balance for "Godišnji odmor" (id: 1)
  const godisnjOdmorId = 1;
  const ledgerForGodisnji = mockLedgerEntries.filter(
    (entry) =>
      entry.employeeId === currentUser.employeeId &&
      entry.unavailabilityReasonId === godisnjOdmorId &&
      entry.year === 2025
  );

  const totalAllocated = ledgerForGodisnji
    .filter((e) => e.type === "ALLOCATION" || e.type === "TRANSFER")
    .reduce((sum, e) => sum + e.changeDays, 0);

  const totalUsed = Math.abs(
    ledgerForGodisnji
      .filter((e) => e.type === "USAGE")
      .reduce((sum, e) => sum + e.changeDays, 0)
  );

  const pendingApplications = employeeApplications.filter(
    (app) => app.status === "SUBMITTED" || app.status === "APPROVED_FIRST_LEVEL"
  );

  const pendingDays = pendingApplications.reduce(
    (sum, app) => sum + (app.requestedWorkdays || 0),
    0
  );

  const available = totalAllocated - totalUsed - pendingDays;

  const recentApplications = employeeApplications
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "SUBMITTED":
        return <Badge className="bg-yellow-500">Na čekanju</Badge>;
      case "APPROVED_FIRST_LEVEL":
        return <Badge className="bg-blue-500">Prvi nivo odobren</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500">Odobreno</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Odbijeno</Badge>;
      case "CANCELLED":
        return <Badge variant="outline">Otkazano</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Pregled godišnjih odmora i zahtjeva
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ukupno Dana
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAllocated}</div>
              <p className="text-xs text-muted-foreground">
                Dodijeljeno za 2025.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Iskorišteno
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsed}</div>
              <p className="text-xs text-muted-foreground">
                Dana već iskorišteno
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Na čekanju</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingDays}</div>
              <p className="text-xs text-muted-foreground">
                Dana čeka odobrenje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preostalo</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{available}</div>
              <p className="text-xs text-muted-foreground">
                Dana na raspolaganju
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nedavni Zahtjevi</CardTitle>
            <Link href="/employee/requests">
              <Button variant="outline" size="sm">
                Svi zahtjevi
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nemate nijedan zahtjev
              </p>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app) => {
                  const reason = mockUnavailabilityReasons.find(
                    (r) => r.id === app.unavailabilityReasonId
                  );
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{reason?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateRange(app.startDate, app.endDate)} (
                          {app.requestedWorkdays} dana)
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Action */}
        <div className="flex justify-center">
          <Link href="/employee/requests/new">
            <Button size="lg" className="gap-2">
              <FileText className="h-5 w-5" />
              Kreiraj Novi Zahtjev
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

