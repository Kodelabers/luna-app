import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { hr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { ApplicationActions } from "../_components/application-actions";
import { ApplicationPeriodCalendar } from "../_components/application-period-calendar";

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

export default async function ApplicationDetailsPage(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("applications.details");
  const tApp = await getTranslations("applications");

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

  // Check if user is DM or GM
  // First check for GM (departmentId IS NULL)
  const gmRecord = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      departmentId: null,
      active: true,
    },
  });

  // Then check for DM (departmentId IS NOT NULL)
  const dmRecord = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      departmentId: { not: null },
      active: true,
    },
  });

  const isGeneralManager = gmRecord !== null;
  const isDepartmentManager = dmRecord !== null;

  // Fetch application - expand query to allow DM/GM to view
  const application = await db.application.findFirst({
    where: {
      id: parseInt(params.applicationId),
      organisationId: ctx.organisationId,
      active: true,
      // Allow owner, DM, or GM to view
      OR: [
        { employeeId: employee.id }, // Owner
        isDepartmentManager ? { departmentId: dmRecord!.departmentId! } : {},
        isGeneralManager ? { organisationId: ctx.organisationId } : {},
      ].filter(obj => Object.keys(obj).length > 0),
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

  if (!application) {
    notFound();
  }

  const clientTimeZone = "Europe/Zagreb";
  const startLocal = toZonedTime(application.startDate, clientTimeZone);
  const endLocal = toZonedTime(application.endDate, clientTimeZone);

  // Check if current user is the owner
  const isOwner = application.employeeId === employee.id;

  // Check if DM has access to this department
  const hasDMAccess = isDepartmentManager && 
    dmRecord?.departmentId === application.departmentId;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={`#${application.id}`}
        action={
          <div className="flex gap-2">
            <ApplicationActions
              organisationAlias={params.organisationAlias}
              applicationId={application.id}
              status={application.status}
              departmentId={application.departmentId}
              isOwner={isOwner}
              isDepartmentManager={hasDMAccess}
              isGeneralManager={isGeneralManager}
            />
            <Link href={`/${params.organisationAlias}/applications`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Natrag
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Osnovni podaci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("employee")}</p>
              <p className="font-medium">
                {application.employee.firstName} {application.employee.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("department")}</p>
              <p className="font-medium">{application.department.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("reason")}</p>
              <p className="font-medium">
                {application.unavailabilityReason.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("status")}</p>
              <Badge
                className={statusColorMap[application.status]}
                variant="default"
              >
                {tApp(`status${application.status}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Period Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>
              {application.requestedWorkdays ?? "-"} {application.requestedWorkdays === 1 ? "dan" : "dana"}
            </CardTitle>
            <CardDescription>
              {format(startLocal, "dd.MM.yyyy", { locale: hr })} -{" "}
              {format(endLocal, "dd.MM.yyyy", { locale: hr })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ApplicationPeriodCalendar
              startDate={startLocal}
              endDate={endLocal}
              reasonColor={application.unavailabilityReason.colorCode}
            />
            <div className="w-full text-center text-sm text-muted-foreground border-t pt-3">
              {t("createdAt")}: {format(application.createdAt, "dd.MM.yyyy HH:mm", { locale: hr })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {application.description && (
        <Card>
          <CardHeader>
            <CardTitle>{t("description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{application.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {application.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("comments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.comments.map((comment) => (
              <div
                key={comment.id}
                className="border-l-2 border-primary pl-4"
              >
                <p className="text-sm text-muted-foreground">
                  {comment.createdBy.user.firstName}{" "}
                  {comment.createdBy.user.lastName} •{" "}
                  {format(comment.createdAt, "dd.MM.yyyy HH:mm", {
                    locale: hr,
                  })}
                </p>
                <p className="mt-1">{comment.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {application.applicationLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("logs")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {application.applicationLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{log.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.createdBy.user.firstName}{" "}
                    {log.createdBy.user.lastName}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(log.createdAt, "dd.MM.yyyy HH:mm", { locale: hr })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

