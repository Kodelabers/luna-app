import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ApplicationForm } from "../../_components/application-form";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { DeleteApplicationSection } from "./_components/delete-application-section";

type PageProps = {
  params: Promise<{ organisationAlias: string; applicationId: string }>;
};

export default async function EditApplicationPage(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("applications");

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

  // Fetch application (allow editing if user is owner or creator)
  const application = await db.application.findFirst({
    where: {
      id: params.applicationId,
      organisationId: ctx.organisationId,
      status: "DRAFT",
      active: true,
      OR: [
        { employeeId: employee.id }, // User is the employee
        { createdById: ctx.organisationUser.id }, // User created it (as manager)
      ],
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  // Fetch unavailability reasons
  const reasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      needApproval: true,
      needSecondApproval: true,
      hasPlanning: true,
      colorCode: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const clientTimeZone = "Europe/Zagreb";
  const startLocal = toZonedTime(application.startDate, clientTimeZone);
  const endLocal = toZonedTime(application.endDate, clientTimeZone);

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("editApplication")}
          description={t("editDescription")}
        />

        <ApplicationForm
          organisationAlias={params.organisationAlias}
          reasons={reasons}
          currentEmployeeId={application.employeeId}
          applicationId={application.id}
          initialData={{
            unavailabilityReasonId: application.unavailabilityReasonId,
            startDate: startLocal,
            endDate: endLocal,
            description: application.description ?? undefined,
          }}
          backHref={`/${params.organisationAlias}/applications/${params.applicationId}`}
        />

        {/* Delete section - only for DRAFT applications */}
        <DeleteApplicationSection
          applicationId={application.id}
          organisationAlias={params.organisationAlias}
        />
      </div>
    </div>
  );
}
