"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { hr, enUS } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Pencil,
  MessageSquare,
  History,
  Calendar,
  User,
  Building2,
  Tag,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ApplicationPeriodCalendar } from "./application-period-calendar";
import {
  ApplicationActions,
  type CorrectionRange,
} from "./application-actions";

const statusColorMap: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  APPROVED_FIRST_LEVEL: "bg-yellow-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
  CANCELLED: "bg-gray-400",
};

const logTypeIconMap: Record<string, string> = {
  CREATED: "📝",
  DELETED: "🗑️",
  REQUESTED: "📤",
  REJECTED: "❌",
  REJECTED_ON_FIRST_APPROVAL: "❌",
  APPROVED: "✅",
  POST_APPROVAL_IMPACT_CHANGED: "🔄",
  APPROVED_WITH_DATE_MODIFICATION: "✅",
};

type AuditEntry = {
  id: string;
  type: "log" | "comment";
  createdAt: Date;
  author: string;
  content: string;
  logType?: string;
};

type ApplicationDetailCardWithActionsProps = {
  application: {
    id: string;
    status: string;
    startDate: Date | string;
    endDate: Date | string;
    createdAt: Date | string;
    description: string | null;
    requestedWorkdays: number | null;
    departmentId: string;
    employeeId: string;
    unavailabilityReason: { name: string; colorCode: string | null };
    department: { name: string };
    employee: { firstName: string; lastName: string };
    comments: Array<{
      id: string;
      comment: string;
      createdAt: Date | string;
      createdBy: {
        user: { firstName: string; lastName: string };
      };
    }>;
    applicationLogs: Array<{
      id: string;
      type: string;
      createdAt: Date | string;
      createdBy: {
        user: { firstName: string; lastName: string };
      };
    }>;
  };
  organisationAlias: string;
  canEdit: boolean;
  isOwner: boolean;
  hasDMAccess: boolean;
  isGeneralManager: boolean;
  clientTimeZone: string;
};

export function ApplicationDetailCardWithActions({
  application,
  organisationAlias,
  canEdit,
  isOwner,
  hasDMAccess,
  isGeneralManager,
  clientTimeZone,
}: ApplicationDetailCardWithActionsProps) {
  const router = useRouter();
  const locale = useLocale();
  const dateLocale = locale === "hr" ? hr : enUS;
  const t = useTranslations("applications.details");
  const tApp = useTranslations("applications");
  const tCommon = useTranslations("common");

  const startLocal = toZonedTime(new Date(application.startDate), clientTimeZone);
  const endLocal = toZonedTime(new Date(application.endDate), clientTimeZone);

  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [correctionRange, setCorrectionRange] = useState<CorrectionRange | null>(
    null
  );

  const enterCorrection = useCallback(() => {
    setIsCorrectionMode(true);
    setCorrectionRange({ from: startLocal, to: endLocal });
  }, [startLocal, endLocal]);

  const cancelCorrection = useCallback(() => {
    setIsCorrectionMode(false);
    setCorrectionRange(null);
  }, []);

  const handleActionComplete = useCallback(() => {
    setIsCorrectionMode(false);
    setCorrectionRange(null);
    router.refresh();
  }, [router]);

  const calendarStart = isCorrectionMode && correctionRange
    ? correctionRange.from
    : startLocal;
  const calendarEnd = isCorrectionMode && correctionRange
    ? correctionRange.to
    : endLocal;

  const reasonColorCode = application.unavailabilityReason.colorCode;

  const auditEntries: AuditEntry[] = [
    ...application.applicationLogs.map((log) => ({
      id: log.id,
      type: "log" as const,
      createdAt: new Date(log.createdAt),
      author: `${log.createdBy.user.firstName} ${log.createdBy.user.lastName}`,
      content: log.type,
      logType: log.type,
    })),
    ...application.comments.map((comment) => ({
      id: comment.id,
      type: "comment" as const,
      createdAt: new Date(comment.createdAt),
      author: `${comment.createdBy.user.firstName} ${comment.createdBy.user.lastName}`,
      content: comment.comment,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const hasAuditEntries = auditEntries.length > 0;
  const hasDateCorrection = application.applicationLogs.some(
    (l) => l.type === "APPROVED_WITH_DATE_MODIFICATION"
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Badge
              variant="secondary"
              className="text-sm py-1 px-3 border w-fit"
              style={
                reasonColorCode
                  ? {
                      backgroundColor: `${reasonColorCode}20`,
                      borderColor: `${reasonColorCode}40`,
                      color: `color-mix(in srgb, ${reasonColorCode}, black 30%)`,
                    }
                  : undefined
              }
            >
              {application.unavailabilityReason.name}
            </Badge>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                {application.requestedWorkdays ?? "-"}{" "}
                {application.requestedWorkdays === 1 ? "dan" : "dana"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(startLocal, "dd.MM.yyyy", { locale: dateLocale })} -{" "}
                {format(endLocal, "dd.MM.yyyy", { locale: dateLocale })}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Badge
              className={statusColorMap[application.status]}
              variant="default"
            >
              {tApp(`status${application.status}`)}
            </Badge>
            {hasDateCorrection && (
              <p className="text-sm text-muted-foreground">
                {tApp("approvedWithDateCorrection")}
              </p>
            )}
            <div className="hidden sm:block">
              <ApplicationPeriodCalendar
                startDate={calendarStart}
                endDate={calendarEnd}
                reasonColor={reasonColorCode}
                readOnly={!isCorrectionMode}
                onRangeChange={
                  isCorrectionMode
                    ? (from, to) => setCorrectionRange({ from, to })
                    : undefined
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("employee")}</p>
                <p className="font-medium">
                  {application.employee.firstName} {application.employee.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("department")}</p>
                <p className="font-medium">{application.department.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("workdays")}</p>
                <p className="font-medium">
                  {application.requestedWorkdays ?? "-"}{" "}
                  {application.requestedWorkdays === 1 ? "radni dan" : "radnih dana"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("createdAt")}</p>
                <p className="font-medium">
                  {format(new Date(application.createdAt), "dd.MM.yyyy HH:mm", {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            </div>
          </div>

          {application.description && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">{t("description")}</p>
              <p className="whitespace-pre-wrap text-sm">{application.description}</p>
            </div>
          )}

          {hasAuditEntries && (
            <Collapsible className="pt-2 border-t">
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline group">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span>
                    {t("logs")} i {t("comments")} ({auditEntries.length})
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-3">
                  {auditEntries.map((entry) => (
                    <div key={entry.id} className="flex gap-3 text-sm">
                      <div className="shrink-0 mt-0.5">
                        {entry.type === "comment" ? (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        ) : (
                          <span className="text-sm">
                            {logTypeIconMap[entry.logType ?? ""] ?? "📋"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{entry.author}</span>
                          <span className="text-muted-foreground text-xs">
                            {format(entry.createdAt, "dd.MM.yyyy HH:mm", {
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                        <p
                          className={
                            entry.type === "comment"
                              ? "text-muted-foreground mt-0.5"
                              : "text-muted-foreground text-xs"
                          }
                        >
                          {entry.type === "log"
                            ? tApp(`logType.${entry.content}`)
                            : entry.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Link href={`/${organisationAlias}/applications`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon("back")}
          </Button>
        </Link>
        <div className="flex gap-2 flex-wrap justify-end">
          <ApplicationActions
            organisationAlias={organisationAlias}
            applicationId={application.id}
            status={application.status as "DRAFT" | "SUBMITTED" | "APPROVED_FIRST_LEVEL" | "APPROVED" | "REJECTED" | "CANCELLED"}
            departmentId={application.departmentId}
            isOwner={isOwner}
            isDepartmentManager={hasDMAccess}
            isGeneralManager={isGeneralManager}
            onActionComplete={handleActionComplete}
            onEnterCorrection={enterCorrection}
            onCancelCorrection={cancelCorrection}
            isCorrectionMode={isCorrectionMode}
            correctionRange={correctionRange}
          />
          {canEdit && (
            <Link href={`/${organisationAlias}/applications/${application.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                {tApp("actions.edit")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
