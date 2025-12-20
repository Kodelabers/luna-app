"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useMockAuth } from "@/lib/mock-data/context";
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
import { mockUnavailabilityReasons } from "@/lib/mock-data/generator";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDateRange } from "@/lib/utils/dates";
import { useMockApplications } from "@/lib/mock-data/api";

export default function EmployeeRequestsPage() {
  const { currentUser } = useMockAuth();
  const { applications } = useMockApplications();

  if (!currentUser) return null;

  const employeeApplications = applications.filter(
    (app) => app.employeeId === currentUser.employeeId
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moji Zahtjevi</h1>
            <p className="text-muted-foreground">
              Pregled svih zahtjeva za godišnji odmor
            </p>
          </div>
          <Link href="/employee/requests/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novi Zahtjev
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Svi Zahtjevi ({employeeApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {employeeApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nemate nijedan zahtjev
                </p>
                <Link href="/employee/requests/new">
                  <Button>Kreirajte Prvi Zahtjev</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Razdoblje</TableHead>
                    <TableHead>Dana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kreirano</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeApplications.map((app) => {
                    const reason = mockUnavailabilityReasons.find(
                      (r) => r.id === app.unavailabilityReasonId
                    );
                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: reason?.colorCode }}
                            />
                            {reason?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateRange(app.startDate, app.endDate)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {app.requestedWorkdays}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString("hr-HR")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

