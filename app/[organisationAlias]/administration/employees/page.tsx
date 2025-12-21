import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeSearchBar } from "./_components/employee-search-bar";
import { EmployeeTable } from "./_components/employee-table";
import { EmployeeDialog } from "./_components/employee-dialog";
import { Pagination } from "@/components/ui/pagination";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";

const PAGE_SIZE = 20;

type Props = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: "asc" | "desc";
    page?: string;
    department?: string;
  }>;
};

export default async function EmployeesPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const {
    search,
    sort = "asc",
    page: pageParam,
    department,
  } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("employees");

  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const departmentId = department ? parseInt(department, 10) : undefined;

  // Build where clause for reuse
  const whereClause = {
    organisationId: ctx.organisationId,
    active: true,
    ...(departmentId && { departmentId }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  // Fetch employees, departments, and count in parallel
  const [employees, totalCount, departments] = await Promise.all([
    db.employee.findMany({
      where: whereClause,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            colorCode: true,
          },
        },
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
    db.department.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        colorCode: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <PageHeader
          title={t("title")}
          description={t("description")}
          action={
            <EmployeeDialog
              organisationAlias={organisationAlias}
              departments={departments}
            />
          }
        />

        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <EmployeeSearchBar departments={departments} />
        </Suspense>
      </CardHeader>

      <CardContent className="p-0">
        {employees.length === 0 && !search && !department ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">{t("noEmployees")}</p>
            <div className="mt-4">
              <EmployeeDialog
                organisationAlias={organisationAlias}
                departments={departments}
              />
            </div>
          </div>
        ) : (
          <div className="p-4">
            <EmployeeTable
              employees={employees}
              organisationAlias={organisationAlias}
              departments={departments}
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
  );
}
