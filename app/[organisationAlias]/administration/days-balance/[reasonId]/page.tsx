import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { resolveTenantContext, getManagerStatus, isAdmin } from "@/lib/tenant/resolveTenantContext";
import { NotFoundError } from "@/lib/errors";
import { db } from "@/lib/db";
import { getManagedDepartments } from "@/lib/services/sidebar";
import { DaysBalanceTableClient } from "../_components/days-balance-table-client";
import { DepartmentFilter } from "../_components/department-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ organisationAlias: string; reasonId: string }>;
  searchParams: Promise<{ department?: string }>;
};

export default async function DaysBalanceByReasonPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations("daysBalance");
  const tErrors = await getTranslations("errors");
  const tCommon = await getTranslations("common");

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
          {tErrors("noAccess")}
        </p>
      </div>
    );
  }

  // Get unavailability reason
  const reasonId = params.reasonId;
  const reason = await db.unavailabilityReason.findFirst({
    where: {
      id: reasonId,
      organisationId: ctx.organisationId,
      active: true,
      hasPlanning: true,
    },
    select: {
      id: true,
      name: true,
      colorCode: true,
    },
  });

  if (!reason) {
    throw new NotFoundError(tErrors("reasonNotFound"));
  }

  // Get managed departments for filter
  // ADMIN and GM have access to all departments
  const managedDepartments = await getManagedDepartments(ctx, {
    includeForAdmin: isAdminUser
  });

  // Parse comma-separated department IDs
  const departmentIds: string[] = searchParams.department
    ? searchParams.department
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
    : [];

  // Validate departmentIds if provided
  const validDepartmentIds: string[] = [];
  if (departmentIds.length > 0) {
    for (const deptId of departmentIds) {
      if (isAdminUser || managerStatus.isGeneralManager) {
        // ADMIN and GM can access any department in organisation
        const dept = managedDepartments.find((d) => d.id === deptId);
        if (dept) {
          validDepartmentIds.push(deptId);
        }
      } else {
        // DM can only access managed departments
        if (managerStatus.managedDepartmentIds.includes(deptId)) {
          validDepartmentIds.push(deptId);
        }
      }
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <PageHeader
            title={`${t("managerTitle")} - ${reason.name}`}
            description={t("managerDescription")}
          />
        </CardHeader>

        {/* Department Filter */}
        {managedDepartments.length > 1 && (


          <CardContent>
            <DepartmentFilter
              departmentIds={validDepartmentIds}
              departments={managedDepartments.map((d) => ({
                id: d.id,
                name: d.name,
                colorCode: d.colorCode,
              }))}
              organisationAlias={params.organisationAlias}
              reasonId={reasonId}
            />
          </CardContent>

        )}
        <CardContent>
          <Suspense fallback={<div>{tCommon("loading")}</div>}>
            <DaysBalanceTableClient
              organisationAlias={params.organisationAlias}
              unavailabilityReasonId={reasonId}
              departmentIds={validDepartmentIds.length > 0 ? validDepartmentIds : undefined}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

