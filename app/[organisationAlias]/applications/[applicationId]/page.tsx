import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, FileQuestion } from "lucide-react";
import Link from "next/link";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
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
    );
  }

  // Check authorization
  const isOwner = application.employeeId === employee.id;
  const hasDMAccess = managedDepartmentIds.includes(application.departmentId);
  const hasAccess = isOwner || hasDMAccess || isGeneralManager;

  // If no access, show access denied page
  if (!hasAccess) {
    return (
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
    );
  }

  const clientTimeZone = "Europe/Zagreb";
  const startLocal = toZonedTime(application.startDate, clientTimeZone);
  const endLocal = toZonedTime(application.endDate, clientTimeZone);

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

