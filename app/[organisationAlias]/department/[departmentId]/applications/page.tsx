import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { DepartmentApplicationsClient } from "./_components/department-applications-client";
import { Plus } from "lucide-react";

type Props = {
  params: Promise<{ organisationAlias: string; departmentId: string }>;
};

export default async function DepartmentApplicationsPage({ params }: Props) {
  const { organisationAlias, departmentId } = await params;
  const t = await getTranslations("applications");
  const ctx = await resolveTenantContext(organisationAlias);

  
  if (!departmentId) {
    notFound();
  }

  // Check department access (DM or GM)
  await requireDepartmentAccess(ctx, departmentId);

  // Get department info
  const department = await db.department.findFirst({
    where: {
      id: departmentId,
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
          action={
            <Link href={`/${organisationAlias}/applications/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("newApplication")}
              </Button>
            </Link>
          }
        />
      </CardHeader>

      <CardContent>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <DepartmentApplicationsClient
            organisationAlias={organisationAlias}
            departmentId={departmentId}
            reasons={reasons}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}
