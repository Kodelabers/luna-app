"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  mockApplications,
  mockEmployees,
  mockDepartments,
  mockUnavailabilityReasons,
} from "@/lib/mock-data/generator";
import { formatDateRange } from "@/lib/utils/dates";
import { Building2, FileText, Users } from "lucide-react";
import Link from "next/link";

export default function GeneralManagerDashboard() {
  const pendingSecondLevel = mockApplications.filter(
    (app) => app.status === "APPROVED_FIRST_LEVEL"
  );

  const allPending = mockApplications.filter(
    (app) => app.status === "SUBMITTED" || app.status === "APPROVED_FIRST_LEVEL"
  );

  const totalEmployees = mockEmployees.filter((e) => e.active).length;

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED_FIRST_LEVEL") {
      return <Badge className="bg-blue-500">Čeka drugi nivo</Badge>;
    }
    return <Badge className="bg-yellow-500">Na čekanju</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">General Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Pregled cijele organizacije i drugo odobrenje zahtjeva
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Odjeli</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDepartments.length}</div>
              <p className="text-xs text-muted-foreground">Ukupno odjela</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zaposlenici</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Aktivnih zaposlenika</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drugi Nivo</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSecondLevel.length}</div>
              <p className="text-xs text-muted-foreground">Čeka finalno odobrenje</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Second Level Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Zahtjevi za Finalno Odobrenje</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSecondLevel.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nema zahtjeva za finalno odobrenje
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaposlenik</TableHead>
                    <TableHead>Odjel</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Razdoblje</TableHead>
                    <TableHead>Dana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSecondLevel.map((app) => {
                    const employee = mockEmployees.find((e) => e.id === app.employeeId);
                    const department = mockDepartments.find(
                      (d) => d.id === app.departmentId
                    );
                    const reason = mockUnavailabilityReasons.find(
                      (r) => r.id === app.unavailabilityReasonId
                    );
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {employee?.firstName} {employee?.lastName}
                        </TableCell>
                        <TableCell>{department?.name}</TableCell>
                        <TableCell>{reason?.name}</TableCell>
                        <TableCell>
                          {formatDateRange(app.startDate, app.endDate)}
                        </TableCell>
                        <TableCell>{app.requestedWorkdays}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm">Odobri</Button>
                            <Button size="sm" variant="destructive">
                              Odbij
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Departments Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Pregled Odjela</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDepartments.map((dept) => {
                const deptEmployees = mockEmployees.filter(
                  (e) => e.departmentId === dept.id && e.active
                );
                const deptPending = allPending.filter(
                  (app) => app.departmentId === dept.id
                );

                return (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {deptEmployees.length} zaposlenika
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {deptPending.length} na čekanju
                        </div>
                      </div>
                      <Link href="/general-manager/departments">
                        <Button size="sm" variant="outline">
                          Detalji
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

