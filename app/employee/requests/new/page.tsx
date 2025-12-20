"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useMockAuth } from "@/lib/mock-data/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockUnavailabilityReasons,
  mockHolidays,
  mockLedgerEntries,
  mockDaySchedules,
} from "@/lib/mock-data/generator";
import { calculateWorkingDays } from "@/lib/utils/workdays";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "@/lib/utils/toast";
import { useBalance } from "@/hooks/useBalance";
import { validateApplication } from "@/lib/utils/validation";
import { useMockApplications, useMockLedgerEntries } from "@/lib/mock-data/api";
import { ApplicationStatus } from "@/lib/types";
import { calculateBalance, calculatePendingDays } from "@/lib/utils/ledger";

export default function CreateRequestPage() {
  const { currentUser } = useMockAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { applications, createApplication, updateApplication, submitApplication } =
    useMockApplications();
  const { ledgerEntries } = useMockLedgerEntries();

  // Find application to edit if editId is provided
  const editingApplication = editId
    ? applications.find(
        (app) => app.id === parseInt(editId) && app.employeeId === currentUser?.employeeId
      )
    : null;

  // Check if editing non-DRAFT application
  useEffect(() => {
    if (editingApplication && editingApplication.status !== ApplicationStatus.DRAFT) {
      toast.error(
        "Greška",
        `Ne možete uređivati zahtjev u statusu: ${editingApplication.status}`
      );
      router.push("/employee/requests");
    }
  }, [editingApplication, router]);

  const [formData, setFormData] = useState({
    unavailabilityReasonId: editingApplication
      ? editingApplication.unavailabilityReasonId.toString()
      : "",
    startDate: editingApplication
      ? editingApplication.startDate.toISOString().split("T")[0]
      : "",
    endDate: editingApplication
      ? editingApplication.endDate.toISOString().split("T")[0]
      : "",
    description: editingApplication?.description || "",
  });
  const [workingDays, setWorkingDays] = useState<number | null>(
    editingApplication?.requestedWorkdays || null
  );
  const [validationErrors, setValidationErrors] = useState<
    Array<{ field?: string; message: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get balance for selected reason
  const reasonId = formData.unavailabilityReasonId
    ? parseInt(formData.unavailabilityReasonId)
    : null;
  const balance = useBalance(
    currentUser?.employeeId || 0,
    reasonId || 1,
    2025,
    undefined,
    applications
  );

  // Calculate working days when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start <= end) {
        const days = calculateWorkingDays(start, end, mockHolidays);
        setWorkingDays(days);
      } else {
        setWorkingDays(null);
      }
    } else {
      setWorkingDays(null);
    }
  }, [formData.startDate, formData.endDate]);

  // Real-time validation
  useEffect(() => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.unavailabilityReasonId ||
      !currentUser
    ) {
      setValidationErrors([]);
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const reasonIdNum = parseInt(formData.unavailabilityReasonId);

    const newApp: Partial<typeof applications[0]> = {
      organisationId: currentUser.organisationId,
      departmentId: currentUser.departmentId || 1,
      employeeId: currentUser.employeeId,
      unavailabilityReasonId: reasonIdNum,
      startDate: start,
      endDate: end,
      requestedWorkdays: workingDays || 0,
      status: ApplicationStatus.DRAFT,
      active: true,
      createdById: currentUser.employeeId,
    };

    // Calculate balance for the selected reason
    let availableBalance = balance.available;
    if (reasonIdNum !== reasonId) {
      const baseBalance = calculateBalance(
        ledgerEntries,
        currentUser.employeeId,
        reasonIdNum,
        2025
      );
      const pending = calculatePendingDays(
        applications,
        currentUser.employeeId,
        reasonIdNum
      );
      availableBalance = baseBalance.allocated - baseBalance.used - pending;
    }

    const errors = validateApplication(
      newApp,
      applications,
      availableBalance,
      undefined, // excludeApplicationId
      mockDaySchedules // daySchedules
    );

    setValidationErrors(errors);
  }, [
    formData.startDate,
    formData.endDate,
    formData.unavailabilityReasonId,
    workingDays,
    currentUser,
    applications,
    balance.available,
    reasonId,
    ledgerEntries,
  ]);

  const handleSubmit = async (isDraft: boolean) => {
    if (!currentUser) {
      toast.error("Greška", "Niste prijavljeni");
      return;
    }

    // If editing, check status
    if (editingApplication && editingApplication.status !== ApplicationStatus.DRAFT) {
      toast.error(
        "Greška",
        `Ne možete uređivati zahtjev u statusu: ${editingApplication.status}`
      );
      return;
    }

    // Basic field validation
    if (!formData.unavailabilityReasonId) {
      toast.error("Greška", "Molimo odaberite tip nedostupnosti");
      return;
    }
    if (!formData.startDate) {
      toast.error("Greška", "Molimo unesite datum početka");
      return;
    }
    if (!formData.endDate) {
      toast.error("Greška", "Molimo unesite datum završetka");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const reasonIdNum = parseInt(formData.unavailabilityReasonId);

    // Get balance for validation - use the hook result if same reason, otherwise calculate directly
    let availableBalance = balance.available;
    if (reasonIdNum !== reasonId) {
      const baseBalance = calculateBalance(
        ledgerEntries,
        currentUser.employeeId,
        reasonIdNum,
        2025
      );
      const pending = calculatePendingDays(
        applications,
        currentUser.employeeId,
        reasonIdNum
      );
      availableBalance = baseBalance.allocated - baseBalance.used - pending;
    }

    // Full validation
    const newApp: Partial<typeof applications[0]> = {
      organisationId: currentUser.organisationId,
      departmentId: currentUser.departmentId || 1,
      employeeId: currentUser.employeeId,
      unavailabilityReasonId: reasonIdNum,
      startDate: start,
      endDate: end,
      requestedWorkdays: workingDays || 0,
      description: formData.description || undefined,
      status: isDraft
        ? ApplicationStatus.DRAFT
        : ApplicationStatus.SUBMITTED,
      active: true,
      createdById: currentUser.employeeId,
    };

    const errors = validateApplication(
      newApp,
      applications,
      availableBalance,
      editingApplication?.id, // excludeApplicationId when editing
      mockDaySchedules // daySchedules
    );

    if (errors.length > 0) {
      // Show first error as toast
      toast.error("Greška", errors[0].message);
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingApplication) {
        // Update existing application
        updateApplication(editingApplication.id, newApp as any);
        
        if (isDraft) {
          toast.success("Uspjeh", "Zahtjev ažuriran");
        } else {
          // Submit updated application
          submitApplication(editingApplication.id, ApplicationStatus.SUBMITTED);
          toast.success("Uspjeh", "Zahtjev ažuriran i poslan na odobrenje");
        }
      } else {
        // Create new application
        const created = createApplication(newApp as any);

        if (isDraft) {
          toast.success("Uspjeh", "Zahtjev spremljen kao draft");
        } else {
          // If not draft, submit it
          submitApplication(created.id, ApplicationStatus.SUBMITTED);
          toast.success("Uspjeh", "Zahtjev poslan na odobrenje");
        }
      }

      // Navigate back to requests list
      setTimeout(() => {
        router.push("/employee/requests");
      }, 1000);
    } catch (error) {
      toast.error("Greška", editingApplication ? "Neuspješno ažuriranje zahtjeva" : "Neuspješno kreiranje zahtjeva");
      setIsSubmitting(false);
    }
  };

  const selectedReason = mockUnavailabilityReasons.find(
    (r) => r.id.toString() === formData.unavailabilityReasonId
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/employee">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {editingApplication ? "Uredi Zahtjev" : "Novi Zahtjev"}
            </h1>
            <p className="text-muted-foreground">
              Kreirajte zahtjev za godišnji odmor ili drugu vrstu nedostupnosti
            </p>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error.message}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Detalji Zahtjeva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reason">Tip Nedostupnosti *</Label>
              <Select
                value={formData.unavailabilityReasonId}
                onValueChange={(value) =>
                  setFormData({ ...formData, unavailabilityReasonId: value })
                }
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Odaberite tip..." />
                </SelectTrigger>
                <SelectContent>
                  {mockUnavailabilityReasons
                    .filter((r) => r.active)
                    .map((reason) => (
                      <SelectItem
                        key={reason.id}
                        value={reason.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: reason.colorCode }}
                          />
                          {reason.name}
                          {reason.needApproval && (
                            <span className="text-xs text-muted-foreground">
                              (Potrebno odobrenje)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Balance Display */}
            {reasonId && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dostupno</p>
                      <p className="text-2xl font-bold">{balance.available}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ukupno</p>
                      <p className="text-2xl font-bold">{balance.allocated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Datum Početka *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Datum Završetka *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value });
                  }}
                />
              </div>
            </div>

            {workingDays !== null && workingDays > 0 && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Broj radnih dana
                    </p>
                    <p className="text-3xl font-bold">{workingDays}</p>
                    {reasonId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Preostalo nakon ovog zahtjeva:{" "}
                        {balance.available - workingDays} dana
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Napomena (opcionalno)</Label>
              <Textarea
                id="description"
                placeholder="Unesite dodatne informacije..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                className="flex-1"
                disabled={isSubmitting || validationErrors.length > 0}
              >
                Spremi kao Draft
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                className="flex-1"
                disabled={isSubmitting || validationErrors.length > 0}
              >
                {isSubmitting ? "Šalje se..." : "Pošalji na Odobrenje"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
