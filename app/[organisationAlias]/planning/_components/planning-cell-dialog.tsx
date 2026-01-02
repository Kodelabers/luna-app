"use client";

import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  PlanningCell,
  PlanningDay,
  PlanningEmployee,
} from "@/lib/services/planning";
import { ApplicationStatus, EmployeeStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";

type PlanningCellDialogProps = {
  employee: PlanningEmployee;
  day: PlanningDay;
  cell: PlanningCell;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationAlias?: string;
};

const statusLabels: Record<EmployeeStatus, string> = {
  AVAILABLE: "Dostupan",
  NOT_AVAILABLE: "Nedostupan",
  SELECTED_FOR_DUTY: "Odabran za dužnost",
};

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  DRAFT: "Nacrt",
  SUBMITTED: "Poslan",
  APPROVED_FIRST_LEVEL: "Odobreno (1. razina)",
  APPROVED: "Odobreno",
  REJECTED: "Odbijeno",
  CANCELLED: "Otkazano",
};

export function PlanningCellDialog({
  employee,
  day,
  cell,
  open,
  onOpenChange,
  organisationAlias,
}: PlanningCellDialogProps) {
  const t = useTranslations("planning");
  const tApp = useTranslations("applications");
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;

  const date = parseISO(day.dateLocalISO);
  const formattedDate = format(date, "PPP", { locale: dateLocale });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("cellDetails.title")} — {formattedDate}
          </DialogTitle>
          <DialogDescription>
            {employee.firstName} {employee.lastName} ({employee.departmentName})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Day info */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t("cellDetails.dayInfo")}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cellDetails.date")}</span>
                <span>{formattedDate}</span>
              </div>
              {day.isWeekend && (
                <div className="flex justify-end">
                  <Badge variant="outline">{t("cellDetails.weekend")}</Badge>
                </div>
              )}
              {day.isHoliday && (
                <div className="flex justify-end">
                  <Badge variant="outline">{day.holidayName}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* DaySchedule (Plan) */}
          {cell.daySchedule && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">{t("cellDetails.plan")}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("cellDetails.status")}
                    </span>
                    <Badge variant="outline">
                      {statusLabels[cell.daySchedule.status]}
                    </Badge>
                  </div>
                  {cell.daySchedule.unavailabilityReasonName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("cellDetails.reason")}
                      </span>
                      <div className="flex items-center gap-2">
                        {cell.daySchedule.unavailabilityReasonColor && (
                          <div
                            className="h-3 w-3 rounded-xs"
                            style={{
                              backgroundColor:
                                cell.daySchedule.unavailabilityReasonColor,
                            }}
                          />
                        )}
                        <span>{cell.daySchedule.unavailabilityReasonName}</span>
                      </div>
                    </div>
                  )}
                  {cell.daySchedule.applicationId && organisationAlias && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {t("cellDetails.application")}
                      </span>
                      <Link
                        href={`/${organisationAlias}/applications/${cell.daySchedule.applicationId}`}
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        {t("cellDetails.viewApplication")}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Applications (Overlay) */}
          {cell.applications.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">
                  {t("cellDetails.applications")} ({cell.applications.length})
                </h3>
                <div className="space-y-3">
                  {cell.applications.map((app) => (
                    <div
                      key={app.id}
                      className="border rounded-md p-3 space-y-2 text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {app.unavailabilityReasonColor && (
                            <div
                              className="h-3 w-3 rounded-xs"
                              style={{
                                backgroundColor: app.unavailabilityReasonColor,
                              }}
                            />
                          )}
                          <span className="font-medium">
                            {app.unavailabilityReasonName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            app.status === "APPROVED"
                              ? "default"
                              : app.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {applicationStatusLabels[app.status]}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {format(parseISO(app.startDateLocalISO), "PPP", {
                            locale: dateLocale,
                          })}
                        </span>
                        <span>—</span>
                        <span>
                          {format(parseISO(app.endDateLocalISO), "PPP", {
                            locale: dateLocale,
                          })}
                        </span>
                      </div>
                      {organisationAlias && (
                        <div className="pt-2">
                          <Link
                            href={`/${organisationAlias}/applications/${app.id}`}
                            className="flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            {t("cellDetails.viewApplication")}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!cell.daySchedule && cell.applications.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              {t("cellDetails.noData")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

