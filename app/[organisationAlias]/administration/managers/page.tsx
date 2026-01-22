import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ManagerTable } from "./_components/manager-table";
import { ManagerFilter } from "./_components/manager-filter";

type Props = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{ department?: string }>;
};

export default async function ManagersPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const { department: departmentParam } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("managers");

  // Parse department filter
  // "all" or undefined = show all
  // "general" = show only general managers
  // string = show only that department
  let filteredDepartmentId: string | null | undefined = undefined;
  if (departmentParam === "general") {
    filteredDepartmentId = null;
  } else if (departmentParam && departmentParam !== "all") {
    filteredDepartmentId = departmentParam;
  }

  // Fetch general managers and departments with their managers in parallel
  const [generalManagers, departments] = await Promise.all([
    // General managers (departmentId = null)
    db.manager.findMany({
      where: {
        departmentId: null,
        active: true,
        employee: {
          organisationId: ctx.organisationId,
          active: true,
        },
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
      orderBy: {
        employee: {
          lastName: "asc",
        },
      },
    }),
    // Departments with their managers
    db.department.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
      },
      include: {
        managers: {
          where: {
            active: true,
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
          orderBy: {
            employee: {
              lastName: "asc",
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  // For filter dropdown, we need departments without managers
  const departmentsForFilter = departments.map((d) => ({
    id: d.id,
    name: d.name,
    colorCode: d.colorCode,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <PageHeader title={t("title")} description={t("description")} />
          <Suspense fallback={<Skeleton className="h-10 w-[220px]" />}>
            <ManagerFilter departments={departmentsForFilter} />
          </Suspense>
        </CardHeader>

        <CardContent className="p-4">
          <ManagerTable
            generalManagers={generalManagers}
            departments={departments}
            organisationAlias={organisationAlias}
            filteredDepartmentId={filteredDepartmentId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
