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
import {
  mockEmployees,
  mockUnavailabilityReasons,
} from "@/lib/mock-data/generator";
import { useMockApplications } from "@/lib/mock-data/api";
import { formatDateRange } from "@/lib/utils/dates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ManagerRequestsPage() {
  const { currentUser } = useMockAuth();
  const { applications } = useMockApplications();
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");

  if (!currentUser || !currentUser.departmentId) return null;

  const departmentApplications = applications.filter(
    (app) => app.departmentId === currentUser.departmentId
  );

  const pendingApplications = departmentApplications.filter(
    (app) => app.status === "SUBMITTED" || app.status === "APPROVED_FIRST_LEVEL"
  );

  const handleAction = () => {
    if (!selectedApp) return;
    
    alert(
      actionType === "approve"
        ? "Zahtjev odobren!"
        : "Zahtjev odbijen!"
    );
    
    setSelectedApp(null);
    setActionType(null);
    setComment("");
  };

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
          <h1 className="text-3xl font-bold">Zahtjevi za Odobrenje</h1>
          <p className="text-muted-foreground">
            Pregled i odobravanje zahtjeva zaposlenika
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Zahtjevi na čekanju ({pendingApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nema zahtjeva na čekanju
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zaposlenik</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Razdoblje</TableHead>
                    <TableHead>Dana</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApplications.map((app) => {
                    const employee = mockEmployees.find(
                      (e) => e.id === app.employeeId
                    );
                    const reason = mockUnavailabilityReasons.find(
                      (r) => r.id === app.unavailabilityReasonId
                    );
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {employee?.firstName} {employee?.lastName}
                        </TableCell>
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
                        <TableCell>{app.requestedWorkdays}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app.id);
                                setActionType("approve");
                              }}
                            >
                              Odobri
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedApp(app.id);
                                setActionType("reject");
                              }}
                            >
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
      </div>

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Odobri Zahtjev" : "Odbij Zahtjev"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Možete dodati opcionalnu napomenu."
                : "Molimo navedite razlog odbijanja."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {actionType === "approve" ? "Napomena (opcionalno)" : "Razlog odbijanja *"}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Unesite napomenu..."
                    : "Unesite razlog odbijanja..."
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApp(null);
                setActionType(null);
                setComment("");
              }}
            >
              Odustani
            </Button>
            <Button onClick={handleAction}>
              {actionType === "approve" ? "Odobri" : "Odbij"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

