import { Suspense } from "react";
import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { DepartmentEmployeeSearchBar } from "./_components/department-employee-search-bar";
import { DepartmentEmployeeTable } from "./_components/department-employee-table";

const PAGE_SIZE = 20;

type Props = {
  params: Promise<{ organisationAlias: string; departmentId: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: "asc" | "desc";
    page?: string;
  }>;
};

export default async function DepartmentEmployeesPage({ params, searchParams }: Props) {
  const { organisationAlias, departmentId } = await params;
  const { search, sort = "asc", page: pageParam } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("employees");

  const deptId = departmentId;
  if (!deptId) {
    notFound();
  }

  // Check department access
  await requireDepartmentAccess(ctx, deptId);

  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

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

  // Build where clause
  const whereClause = {
    organisationId: ctx.organisationId,
    departmentId: deptId,
    active: true,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  // Fetch employees and count in parallel
  const [employees, totalCount] = await Promise.all([
    db.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
      },
      orderBy: {
        lastName: sort,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.employee.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <PageHeader
            title={`${t("title")} - ${department.name}`}
            description={t("description")}
          />

          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <DepartmentEmployeeSearchBar />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0">
          {employees.length === 0 && !search ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{t("noEmployees")}</p>
            </div>
          ) : (
            <div className="p-4">
              <DepartmentEmployeeTable
                employees={employees}
                organisationAlias={organisationAlias}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
