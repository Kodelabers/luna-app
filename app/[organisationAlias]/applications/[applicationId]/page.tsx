import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, FileQuestion } from "lucide-react";
import Link from "next/link";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ApplicationDetailCardWithActions } from "../_components/application-detail-card-with-actions";

type PageProps = {
  params: Promise<{ organisationAlias: string; applicationId: string }>;
};

export default async function ApplicationDetailsPage(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("applications.details");

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
  const canEdit = isOwner && application.status === "DRAFT";

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">#{application.id}</p>
        </div>
        <ApplicationDetailCardWithActions
          application={application}
          organisationAlias={params.organisationAlias}
          canEdit={canEdit}
          isOwner={isOwner}
          hasDMAccess={hasDMAccess}
          isGeneralManager={isGeneralManager}
          clientTimeZone={clientTimeZone}
        />
      </div>
    </div>
  );
}
