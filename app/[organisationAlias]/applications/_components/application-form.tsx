"use client";

import React, { useActionState, useEffect, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { saveDraftApplicationAction } from "@/lib/actions/application";
import { FormState } from "@/lib/errors";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { DateRange } from "react-day-picker";
import { CalendarDay } from "@/lib/services/calendar";
import { parseISO } from "date-fns";

type UnavailabilityReason = {
  id: string;
  name: string;
  needApproval: boolean;
  needSecondApproval: boolean;
  hasPlanning: boolean;
  colorCode: string | null;
};

type PendingApplication = {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  unavailabilityReason: {
    colorCode: string | null;
  };
};

type LedgerBalance = {
  reasonId: string;
  reasonName: string;
  byYear: Array<{
    year: number;
    allocated: number;
    used: number;
    remaining: number;
  }>;
};

type SelectableEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string | null;
};

type ApplicationFormProps = {
  organisationAlias: string;
  reasons: UnavailabilityReason[];
  currentEmployeeId: string;
  selectableEmployees?: SelectableEmployee[];
  isManager?: boolean;
  applicationId?: string;
  initialData?: {
    unavailabilityReasonId: string;
    startDate: Date;
    endDate: Date;
    description?: string;
  };
  onSuccess?: (applicationId: string) => void;
};

export function ApplicationForm({
  organisationAlias,
  reasons,
  currentEmployeeId,
  selectableEmployees = [],
  isManager = false,
  applicationId,
  initialData,
  onSuccess,
}: ApplicationFormProps) {
  const t = useTranslations("applications");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(currentEmployeeId);
  const [selectedReasonId, setSelectedReasonId] = useState<string | undefined>(
    initialData?.unavailabilityReasonId
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialData?.startDate && initialData?.endDate
      ? { from: initialData.startDate, to: initialData.endDate }
      : undefined
  );
  const [description, setDescription] = useState<string>(
    initialData?.description ?? ""
  );

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [ledgerBalance, setLedgerBalance] = useState<LedgerBalance[]>([]);
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(false);

  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    saveDraftApplicationAction.bind(null, organisationAlias),
    { success: false }
  );

  const selectedReason = reasons.find((r) => r.id === selectedReasonId);
  const selectedEmployee = selectableEmployees.find((e) => e.id === selectedEmployeeId);
  
  const startDate = dateRange?.from;
  const endDate = dateRange?.to;

  // Fetch employee data when selected employee changes
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoadingEmployeeData(true);
      // Reset form state when employee changes (only if not initial load)
      if (selectedEmployeeId !== currentEmployeeId || !initialData) {
        setDateRange(undefined);
        setValidationResult(null);
      }
      
      try {
        const response = await fetch(
          `/${organisationAlias}/api/applications/employee-data`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employeeId: selectedEmployeeId }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setCalendarDays(data.calendarDays || []);
          setPendingApplications(data.pendingApplications || []);
          setLedgerBalance(data.ledgerBalance || []);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setIsLoadingEmployeeData(false);
      }
    };

    fetchEmployeeData();
  }, [selectedEmployeeId, organisationAlias]);

  // Build calendar data with useMemo to recalculate when dependencies change
  const { calendarModifiers, calendarModifiersStyles, approvedDaysByColor, pendingDaysByColor } = useMemo(() => {
    // Build modifiers and styles for approved days (grouped by color)
    const approvedDaysByColor = new Map<string, Date[]>();
    calendarDays
      .filter((day) => day.status === "NOT_AVAILABLE" && day.unavailabilityReasonColor)
      .forEach((day) => {
        const color = day.unavailabilityReasonColor!;
        if (!approvedDaysByColor.has(color)) {
          approvedDaysByColor.set(color, []);
        }
        approvedDaysByColor.get(color)!.push(parseISO(day.dateISO));
      });

    // Build modifiers for pending applications (grouped by color)
    const pendingDaysByColor = new Map<string, Date[]>();
    pendingApplications.forEach((app) => {
      const color = app.unavailabilityReason.colorCode || "#fbbf24"; // default to warning color
      if (!pendingDaysByColor.has(color)) {
        pendingDaysByColor.set(color, []);
      }
      
      const start = new Date(app.startDate);
      const end = new Date(app.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        pendingDaysByColor.get(color)!.push(new Date(d));
      }
    });

    // Create modifiers object
    const calendarModifiers: Record<string, Date[]> = {};
    
    // Add approved days by color
    let colorIndex = 0;
    approvedDaysByColor.forEach((dates, color) => {
      calendarModifiers[`approved-${colorIndex}`] = dates;
      colorIndex++;
    });

    // Add pending days by color
    let pendingIndex = 0;
    pendingDaysByColor.forEach((dates, color) => {
      calendarModifiers[`pending-${pendingIndex}`] = dates;
      pendingIndex++;
    });

    // Create modifiers styles
    const calendarModifiersStyles: Record<string, React.CSSProperties> = {};

    // Approved days - background color
    colorIndex = 0;
    approvedDaysByColor.forEach((dates, color) => {
      calendarModifiersStyles[`approved-${colorIndex}`] = {
        backgroundColor: color,
        color: "white",
        borderRadius: "0.375rem",
      };
      colorIndex++;
    });

    // Pending days - border only
    pendingIndex = 0;
    pendingDaysByColor.forEach((dates, color) => {
      calendarModifiersStyles[`pending-${pendingIndex}`] = {
        border: `2px solid ${color}`,
        borderRadius: "0.375rem",
      };
      pendingIndex++;
    });

    return { calendarModifiers, calendarModifiersStyles, approvedDaysByColor, pendingDaysByColor };
  }, [calendarDays, pendingApplications]);

  // Validate when dates or reason changes
  useEffect(() => {
    if (selectedReasonId && startDate && endDate) {
      validateDraft();
    }
  }, [selectedReasonId, startDate, endDate]);

  // Handle success
  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      if (state.data?.applicationId) {
        // Redirect to application details page
        router.push(`/${organisationAlias}/applications/${state.data.applicationId}`);
      }
    } else if (state.formError) {
      toast.error(state.formError);
    }
  }, [state, router, organisationAlias]);

  const validateDraft = async () => {
    if (!selectedReasonId || !startDate || !endDate) return;

    setIsValidating(true);
    try {
      const response = await fetch(
        `/${organisationAlias}/api/applications/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unavailabilityReasonId: selectedReasonId,
            startDateLocalISO: format(startDate, "yyyy-MM-dd"),
            endDateLocalISO: format(endDate, "yyyy-MM-dd"),
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            editingApplicationId: applicationId,
            employeeId: selectedEmployeeId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t(applicationId ? "editApplication" : "newApplication")}</CardTitle>
          <CardDescription>
            {t(applicationId ? "editDescription" : "createDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Selection (for managers) */}
          {isManager && selectableEmployees.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("employee")}</label>
              <Select
                value={selectedEmployeeId.toString()}
                onValueChange={(value) => setSelectedEmployeeId(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.firstName} {emp.lastName} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="employeeId" value={selectedEmployeeId} />
              <p className="text-xs text-muted-foreground">
                {t("creatingOnBehalf")}
              </p>
            </div>
          )}

          {/* Ledger Balance Display */}
          {ledgerBalance.length > 0 && (() => {
            // Get unique years from selected date range, or default to current and next year
            const selectedYears = new Set<number>();
            
            if (startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                selectedYears.add(d.getFullYear());
              }
            } else {
              // Default to current and next year
              const currentYear = new Date().getFullYear();
              selectedYears.add(currentYear);
              selectedYears.add(currentYear + 1);
            }
            
            const years = Array.from(selectedYears).sort();
            
            return (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="text-sm font-medium mb-3">{t("ledgerBalance")}</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">{t("reason")}</TableHead>
                        {years.map((year) => (
                          <TableHead key={year} className="text-center" colSpan={3}>
                            {year}
                          </TableHead>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableHead></TableHead>
                        {years.map((year) => (
                          <React.Fragment key={year}>
                            <TableHead className="text-center text-xs">
                              {t("allocated")}
                            </TableHead>
                            <TableHead className="text-center text-xs">
                              {t("used")}
                            </TableHead>
                            <TableHead className="text-center text-xs font-semibold">
                              {t("remaining")}
                            </TableHead>
                          </React.Fragment>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerBalance.map((balance) => {
                        // Filter balance data to only show years in the selected range
                        const relevantYears = balance.byYear.filter((yearData) =>
                          selectedYears.has(yearData.year)
                        );
                        
                        // Don't show reason if no relevant years
                        if (relevantYears.length === 0) return null;
                        
                        // Create a map for quick lookup
                        const yearDataMap = new Map(
                          relevantYears.map((y) => [y.year, y])
                        );
                        
                        return (
                          <TableRow key={balance.reasonId}>
                            <TableCell className="font-medium">{balance.reasonName}</TableCell>
                            {years.map((year) => {
                              const yearData = yearDataMap.get(year);
                              if (!yearData) {
                                return (
                                  <React.Fragment key={`${balance.reasonId}-${year}`}>
                                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                                    <TableCell className="text-center text-muted-foreground">-</TableCell>
                                  </React.Fragment>
                                );
                              }
                              return (
                                <React.Fragment key={`${balance.reasonId}-${year}`}>
                                  <TableCell className="text-center">
                                    {yearData.allocated}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {yearData.used}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold text-primary">
                                    {yearData.remaining}
                                  </TableCell>
                                </React.Fragment>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })()}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("reason")}</label>
            <Select
              value={selectedReasonId?.toString()}
              onValueChange={(value) => setSelectedReasonId(value)}
              name="unavailabilityReasonId"
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id.toString()}>
                    {reason.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.unavailabilityReasonId && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.unavailabilityReasonId[0]}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("dateRange")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP", { locale: dateLocale })} -{" "}
                        {format(dateRange.to, "PPP", { locale: dateLocale })}
                      </>
                    ) : (
                      format(dateRange.from, "PPP", { locale: dateLocale })
                    )
                  ) : (
                    <span>{t("selectDateRange")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="space-y-3">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={dateLocale}
                    modifiers={calendarModifiers}
                    modifiersStyles={calendarModifiersStyles}
                  />
                  
                  {/* Legend */}
                  {(approvedDaysByColor.size > 0 || pendingDaysByColor.size > 0) && (
                    <div className="border-t px-3 pb-3 pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {t("legend")}:
                      </p>
                      <div className="space-y-2">
                        {/* Approved days */}
                        {approvedDaysByColor.size > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1.5">{t("approved")}:</p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(approvedDaysByColor.entries()).map(([color, dates], idx) => {
                                // Find a day with this color to get the reason name
                                const sampleDay = calendarDays.find(
                                  (d) => d.unavailabilityReasonColor === color
                                );
                                return (
                                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                                    <div
                                      className="h-3 w-3 rounded-sm"
                                      style={{
                                        backgroundColor: color,
                                      }}
                                    />
                                    <span>{sampleDay?.unavailabilityReasonName || "Odobreno"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Pending days */}
                        {pendingDaysByColor.size > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1.5">{t("pendingApproval")}:</p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(pendingDaysByColor.entries()).map(([color, dates], idx) => {
                                // Find an application with this color to get the reason name
                                const sampleApp = pendingApplications.find(
                                  (app) => app.unavailabilityReason.colorCode === color
                                );
                                // Find the reason name from reasons list
                                const reason = reasons.find(
                                  (r) => r.colorCode === color
                                );
                                return (
                                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                                    <div
                                      className="h-3 w-3 rounded-sm border-2"
                                      style={{
                                        borderColor: color,
                                      }}
                                    />
                                    <span>{reason?.name || "U procesu"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="startDateLocalISO"
              value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
            />
            <input
              type="hidden"
              name="endDateLocalISO"
              value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            />
            {(state.fieldErrors?.startDateLocalISO || state.fieldErrors?.endDateLocalISO) && (
              <p className="text-sm text-destructive">
                {state.fieldErrors?.startDateLocalISO?.[0] || state.fieldErrors?.endDateLocalISO?.[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("description")}</label>
            <Textarea
              name="description"
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Hidden fields */}
          <input
            type="hidden"
            name="clientTimeZone"
            value={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />
          {applicationId && (
            <input type="hidden" name="applicationId" value={applicationId} />
          )}
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {validationResult && (
        <div className="space-y-4">
          {/* Errors */}
          {validationResult.fieldErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {Object.entries(validationResult.fieldErrors).map(
                    ([field, errors]: [string, any]) =>
                      errors.map((error: string, idx: number) => (
                        <li key={`${field}-${idx}`}>{error}</li>
                      ))
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Blocking Overlaps */}
          {validationResult.blockingOverlaps &&
            validationResult.blockingOverlaps.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    {t("validation.overlapWithActive")}
                  </p>
                  <ul className="list-disc pl-4">
                    {validationResult.blockingOverlaps.map(
                      (overlap: any, idx: number) => (
                        <li key={idx}>
                          #{overlap.applicationId}: {overlap.startLocalISO} -{" "}
                          {overlap.endLocalISO} ({overlap.status})
                        </li>
                      )
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

          {/* Warnings */}
          {validationResult.warnings &&
            validationResult.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {validationResult.warnings.map(
                      (warning: string, idx: number) => (
                        <li key={idx}>{warning}</li>
                      )
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={
            isPending ||
            isValidating ||
            !validationResult?.isValid ||
            !selectedReasonId ||
            !startDate ||
            !endDate
          }
        >
          {isPending ? tCommon("loading") : t("saveDraft")}
        </Button>
      </div>
    </form>
  );
}

