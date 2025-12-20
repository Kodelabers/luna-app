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
import {
  useMockApplications,
  useMockLedgerEntries,
  useMockDaySchedules,
  useApprovalActions,
} from "@/lib/mock-data/api";
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
import { ApplicationStatus } from "@/lib/types";
import { toast } from "@/lib/utils/toast";
import { useBalance } from "@/hooks/useBalance";
import { findOverlappingApps } from "@/lib/utils/overlap";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info } from "lucide-react";

export default function ManagerRequestsPage() {
  const { currentUser } = useMockAuth();
  const { applications, updateApplication } = useMockApplications();
  const { createLedgerEntry } = useMockLedgerEntries();
  const { createDaySchedulesForApplication, findOverlappingDaySchedules } =
    useMockDaySchedules();
  const { approveApplication, rejectApplication } = useApprovalActions(
    applications,
    updateApplication,
    createLedgerEntry,
    createDaySchedulesForApplication
  );

  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!currentUser || !currentUser.departmentId) return null;

  const departmentApplications = applications.filter(
    (app) => app.departmentId === currentUser.departmentId
  );

  const pendingApplications = departmentApplications.filter(
    (app) =>
      app.status === ApplicationStatus.SUBMITTED ||
      app.status === ApplicationStatus.APPROVED_FIRST_LEVEL
  );

  const selectedApplication = selectedApp
    ? applications.find((app) => app.id === selectedApp)
    : null;

  const selectedEmployee = selectedApplication
    ? mockEmployees.find((e) => e.id === selectedApplication.employeeId)
    : null;

  const selectedReason = selectedApplication
    ? mockUnavailabilityReasons.find(
        (r) => r.id === selectedApplication.unavailabilityReasonId
      )
    : null;

  // Get balance for selected employee
  const employeeBalance =
    selectedApplication && selectedReason
      ? useBalance(
          selectedApplication.employeeId,
          selectedApplication.unavailabilityReasonId,
          2025,
          undefined,
          applications
        )
      : null;

  // Find overlapping applications
  const overlappingApps = selectedApplication
    ? findOverlappingApps(selectedApplication, applications).filter(
        (app) => app.id !== selectedApplication.id
      )
    : [];

  // Find overlapping DaySchedule entries
  const overlappingDaySchedules = selectedApplication
    ? findOverlappingDaySchedules(
        selectedApplication.employeeId,
        selectedApplication.startDate,
        selectedApplication.endDate
      )
    : [];

  const handleAction = async () => {
    if (!selectedApp || !currentUser) return;

    setIsProcessing(true);

    try {
      if (actionType === "approve") {
        const result = approveApplication(selectedApp, currentUser, comment);
        if (result.success) {
          toast.success(
            "Zahtjev odobren",
            selectedReason?.needSecondApproval
              ? "Zahtjev čeka drugi nivo odobrenja"
              : "Zahtjev je konačno odobren"
          );
          setSelectedApp(null);
          setActionType(null);
          setComment("");
        } else {
          toast.error("Greška", result.error || "Neuspješno odobrenje");
        }
      } else if (actionType === "reject") {
        if (!comment || comment.trim().length === 0) {
          toast.error("Greška", "Razlog odbijanja je obavezan");
          setIsProcessing(false);
          return;
        }

        const result = rejectApplication(selectedApp, currentUser, comment);
        if (result.success) {
          toast.success("Zahtjev odbijen", "Zahtjev je uspješno odbijen");
          setSelectedApp(null);
          setActionType(null);
          setComment("");
        } else {
          toast.error("Greška", result.error || "Neuspješno odbijanje");
        }
      }
    } catch (error) {
      toast.error("Greška", "Došlo je do greške pri obradi zahtjeva");
    } finally {
      setIsProcessing(false);
    }
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
                                setComment("");
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
                                setComment("");
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

      <Dialog
        open={!!selectedApp}
        onOpenChange={() => {
          setSelectedApp(null);
          setActionType(null);
          setComment("");
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Odobri Zahtjev" : "Odbij Zahtjev"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Pregledajte detalje zahtjeva prije odobrenja."
                : "Molimo navedite razlog odbijanja."}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && selectedEmployee && selectedReason && (
            <div className="space-y-4 py-4">
              {/* Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalji Zahtjeva</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Zaposlenik</Label>
                    <p className="font-medium">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.title}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground">Tip Nedostupnosti</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedReason.colorCode }}
                      />
                      <p className="font-medium">{selectedReason.name}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground">Razdoblje</Label>
                    <p className="font-medium">
                      {formatDateRange(
                        selectedApplication.startDate,
                        selectedApplication.endDate
                      )}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground">Broj Radnih Dana</Label>
                    <p className="font-medium text-lg">
                      {selectedApplication.requestedWorkdays} dana
                    </p>
                  </div>

                  {selectedApplication.description && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground">Napomena</Label>
                        <p className="text-sm mt-1">
                          {selectedApplication.description}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Employee Balance */}
              {employeeBalance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Balance Zaposlenika</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Dostupno</Label>
                        <p className="text-2xl font-bold">
                          {employeeBalance.available}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Ukupno</Label>
                        <p className="text-2xl font-bold">
                          {employeeBalance.allocated}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Iskorišteno</Label>
                        <p className="text-lg font-medium">
                          {employeeBalance.used}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Na čekanju</Label>
                        <p className="text-lg font-medium">
                          {employeeBalance.pending}
                        </p>
                      </div>
                    </div>
                    {employeeBalance.available <
                      (selectedApplication.requestedWorkdays || 0) && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          Zaposlenik nema dovoljno dostupnih dana za ovaj zahtjev.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Overlapping Applications */}
              {overlappingApps.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Preklapanja s aktivnim zahtjevima
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-orange-800 mb-3">
                      Ovaj zahtjev se preklapa s {overlappingApps.length}{" "}
                      postojećim zahtjevom/ima:
                    </p>
                    <div className="space-y-2">
                      {overlappingApps.map((app) => {
                        const emp = mockEmployees.find(
                          (e) => e.id === app.employeeId
                        );
                        const reason = mockUnavailabilityReasons.find(
                          (r) => r.id === app.unavailabilityReasonId
                        );
                        return (
                          <div
                            key={app.id}
                            className="p-2 bg-white rounded border border-orange-200"
                          >
                            <p className="font-medium text-sm">
                              {emp?.firstName} {emp?.lastName} - {reason?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateRange(app.startDate, app.endDate)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Overlapping DaySchedule Warning */}
              {actionType === "approve" &&
                overlappingDaySchedules.length > 0 &&
                selectedReason?.hasPlanning && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Upozorenje: Preklapanje s odobrenim zahtjevima
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-red-800 mb-3">
                        Ovaj zahtjev se preklapa s {overlappingDaySchedules.length}{" "}
                        dan/dana iz odobrenih zahtjeva u DaySchedule-u.
                      </p>
                      <p className="text-sm text-red-800 font-medium mb-2">
                        Pri odobrenju će se automatski izvršiti korekcija:
                      </p>
                      <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                        <li>Vraćanje SVIH preostalih dana iz preklopljenih zahtjeva</li>
                        <li>Brisanje DaySchedule zapisa originalnih zahtjeva</li>
                        <li>Kreiranje novih DaySchedule zapisa za ovaj zahtjev</li>
                        <li>Pregazivanje postojećeg plana</li>
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {/* Second Level Approval Info */}
              {actionType === "approve" &&
                selectedReason.needSecondApproval &&
                selectedApplication.status === ApplicationStatus.SUBMITTED && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          Ovaj zahtjev zahtijeva drugi nivo odobrenja. Nakon
                          odobrenja, zahtjev će biti poslan General Manager-u na
                          konačno odobrenje.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Comment Field */}
              <div className="space-y-2">
                <Label htmlFor="comment">
                  {actionType === "approve"
                    ? "Napomena (opcionalno)"
                    : "Razlog odbijanja *"}
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
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApp(null);
                setActionType(null);
                setComment("");
              }}
              disabled={isProcessing}
            >
              Odustani
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                isProcessing ||
                (actionType === "reject" &&
                  (!comment || comment.trim().length === 0))
              }
            >
              {isProcessing
                ? "Obrađuje se..."
                : actionType === "approve"
                ? "Odobri"
                : "Odbij"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
