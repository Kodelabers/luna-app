import { redirect } from "next/navigation";
import { resolveTenantContext, getManagerStatus, isAdmin } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function DaysBalancePage(props: PageProps) {
  const params = await props.params;

  // Resolve tenant context
  const ctx = await resolveTenantContext(params.organisationAlias);

  // Check if user is admin
  const isAdminUser = isAdmin(ctx);

  // Check manager status
  const managerStatus = await getManagerStatus(ctx);

  // Allow access if user is ADMIN, GM, or DM
  if (!isAdminUser && !managerStatus.isGeneralManager && !managerStatus.isDepartmentManager) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          Nemate pristup ovoj funkcionalnosti
        </p>
      </div>
    );
  }

  // Get first unavailability reason with hasPlanning=true
  const firstReason = await db.unavailabilityReason.findFirst({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      hasPlanning: true,
    },
    select: {
      id: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!firstReason) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          Nema vrsta odsutnosti s planiranjem
        </p>
      </div>
    );
  }

  // Redirect to first reason's page
  redirect(`/${params.organisationAlias}/administration/days-balance/${firstReason.id}`);
}
