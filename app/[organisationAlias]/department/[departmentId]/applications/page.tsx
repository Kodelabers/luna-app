import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { DepartmentApplicationsClient } from "./_components/department-applications-client";

type Props = {
  params: Promise<{ organisationAlias: string; departmentId: string }>;
};

export default async function DepartmentApplicationsPage({ params }: Props) {
  const { organisationAlias, departmentId } = await params;
  const t = await getTranslations("applications");
  const ctx = await resolveTenantContext(organisationAlias);

  const deptId = parseInt(departmentId, 10);
  if (isNaN(deptId)) {
    notFound();
  }

  // Check department access (DM or GM)
  await requireDepartmentAccess(ctx, deptId);

  // Get department info
  const department = await db.department.findFirst({
    where: {
      id: deptId,
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!department) {
    notFound();
  }

  // Fetch unavailability reasons for filters
  const reasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <Card>
      <CardHeader>
        <PageHeader
          title={`${t("title")} - ${department.name}`}
          description={t("description")}
        />
      </CardHeader>

      <CardContent>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <DepartmentApplicationsClient
            organisationAlias={organisationAlias}
            departmentId={deptId}
            reasons={reasons}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}
