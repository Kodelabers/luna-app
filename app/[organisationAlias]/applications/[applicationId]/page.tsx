import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, FileQuestion, ChevronDown, Pencil, MessageSquare, History, Calendar, User, Building2, Tag } from "lucide-react";
import Link from "next/link";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { ApplicationActions } from "../_components/application-actions";
import { ApplicationPeriodCalendar } from "../_components/application-period-calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type PageProps = {
  params: Promise<{ organisationAlias: string; applicationId: string }>;
};

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
};

export default async function ApplicationDetailsPage(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("applications.details");
  const tApp = await getTranslations("applications");
  const tCommon = await getTranslations("common");

  // Resolve tenant context
  const ctx = await resolveTenantContext(params.organisationAlias);

  // Get employee
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    redirect(`/${params.organisationAlias}`);
  }

  // Get all manager records for this employee
  const managerRecords = await db.manager.findMany({
    where: {
      employeeId: employee.id,
      active: true,
    },
    select: {
      departmentId: true,
    },
  });

  const isGeneralManager = managerRecords.some((m) => m.departmentId === null);
  const managedDepartmentIds = managerRecords
    .filter((m) => m.departmentId !== null)
    .map((m) => m.departmentId!);
  const isDepartmentManager = managedDepartmentIds.length > 0;

  // Fetch application (without authorization filter first)
  const application = await db.application.findFirst({
    where: {
      id: params.applicationId,
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      unavailabilityReason: {
        select: {
          id: true,
          name: true,
          colorCode: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      comments: {
        include: {
          createdBy: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      applicationLogs: {
        include: {
          createdBy: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // If application not found in this organization, show custom not found page
  if (!application) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Zahtjev nije pronađen</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Zahtjev #{params.applicationId} ne postoji u ovoj organizaciji ili je obrisan.
          </p>
          <Link href={`/${params.organisationAlias}/applications`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Natrag na moje zahtjeve
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check authorization
  const isOwner = application.employeeId === employee.id;
  const hasDMAccess = managedDepartmentIds.includes(application.departmentId);
  const hasAccess = isOwner || hasDMAccess || isGeneralManager;

  // If no access, show access denied page
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <ShieldAlert className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Pristup odbijen</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Nemate ovlasti za pregled ovog zahtjeva. Možete pregledati samo vlastite zahtjeve
            {isDepartmentManager && " te zahtjeve zaposlenika u odjelima kojima upravljate"}.
          </p>
          <Link href={`/${params.organisationAlias}/applications`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Natrag na moje zahtjeve
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const clientTimeZone = "Europe/Zagreb";
  const startLocal = toZonedTime(application.startDate, clientTimeZone);
  const endLocal = toZonedTime(application.endDate, clientTimeZone);

  // Combine logs and comments into a single timeline
  type AuditEntry = {
    id: string;
    type: "log" | "comment";
    createdAt: Date;
    author: string;
    content: string;
    logType?: string;
  };

  const auditEntries: AuditEntry[] = [
    ...application.applicationLogs.map((log) => ({
      id: log.id,
      type: "log" as const,
      createdAt: log.createdAt,
      author: `${log.createdBy.user.firstName} ${log.createdBy.user.lastName}`,
      content: log.type,
      logType: log.type,
    })),
    ...application.comments.map((comment) => ({
      id: comment.id,
      type: "comment" as const,
      createdAt: comment.createdAt,
      author: `${comment.createdBy.user.firstName} ${comment.createdBy.user.lastName}`,
      content: comment.comment,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasAuditEntries = auditEntries.length > 0;

  // Check if user can edit (owner and DRAFT status)
  const canEdit = isOwner && application.status === "DRAFT";

  const reasonColorCode = application.unavailabilityReason.colorCode;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">#{application.id}</p>
        </div>

        <Card className="overflow-hidden">
          {/* Header */}
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            {/* Left side - Reason badge + Days/Period */}
            <div className="flex flex-col gap-3">
              <Badge
                variant="secondary"
                className="text-sm py-1 px-3 border w-fit"
                style={reasonColorCode ? {
                  backgroundColor: `${reasonColorCode}20`,
                  borderColor: `${reasonColorCode}40`,
                  color: `color-mix(in srgb, ${reasonColorCode}, black 30%)`,
                } : undefined}
              >
                {application.unavailabilityReason.name}
              </Badge>
              
              {/* Days + Period */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                  {application.requestedWorkdays ?? "-"} {application.requestedWorkdays === 1 ? "dan" : "dana"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(startLocal, "dd.MM.yyyy", { locale: hr })} - {format(endLocal, "dd.MM.yyyy", { locale: hr })}
                </span>
              </div>
            </div>
            
            {/* Right side - Status badge + Mini calendar */}
            <div className="flex flex-col items-end gap-3">
              <Badge
                className={statusColorMap[application.status]}
                variant="default"
              >
                {tApp(`status${application.status}`)}
              </Badge>
              
              {/* Mini calendar - hidden on mobile */}
              <div className="hidden sm:block">
                <ApplicationPeriodCalendar
                  startDate={startLocal}
                  endDate={endLocal}
                  reasonColor={reasonColorCode}
                />
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="space-y-4">
            {/* Info grid */}
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
                    {application.requestedWorkdays ?? "-"} {application.requestedWorkdays === 1 ? "radni dan" : "radnih dana"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("createdAt")}</p>
                  <p className="font-medium">
                    {format(application.createdAt, "dd.MM.yyyy HH:mm", { locale: hr })}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {application.description && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">{t("description")}</p>
                <p className="whitespace-pre-wrap text-sm">{application.description}</p>
              </div>
            )}

            {/* Audit Section - Collapsible */}
            {hasAuditEntries && (
              <Collapsible className="pt-2 border-t">
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:underline group">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span>Povijest i komentari ({auditEntries.length})</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="space-y-3">
                    {auditEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex gap-3 text-sm"
                      >
                        <div className="shrink-0 mt-0.5">
                          {entry.type === "comment" ? (
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                          ) : (
                            <span className="text-sm">{logTypeIconMap[entry.logType || ""] || "📋"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{entry.author}</span>
                            <span className="text-muted-foreground text-xs">
                              {format(entry.createdAt, "dd.MM.yyyy HH:mm", { locale: hr })}
                            </span>
                          </div>
                          <p className={entry.type === "comment" ? "text-muted-foreground mt-0.5" : "text-muted-foreground text-xs"}>
                            {entry.type === "log" ? tApp(`logType.${entry.content}`) : entry.content}
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

        {/* Action Bar - Below Card */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
          <Link href={`/${params.organisationAlias}/applications`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon("back")}
            </Button>
          </Link>
          
          <div className="flex gap-2 flex-wrap justify-end">
            <ApplicationActions
              organisationAlias={params.organisationAlias}
              applicationId={application.id}
              status={application.status}
              departmentId={application.departmentId}
              isOwner={isOwner}
              isDepartmentManager={hasDMAccess}
              isGeneralManager={isGeneralManager}
            />
            
            {/* Edit button - discrete, only for DRAFT owner */}
            {canEdit && (
              <Link href={`/${params.organisationAlias}/applications/${application.id}/edit`}>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4 mr-1" />
                  {tApp("actions.edit")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
