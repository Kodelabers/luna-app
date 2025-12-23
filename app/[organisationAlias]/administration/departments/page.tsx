import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentSearchBar } from "./_components/department-search-bar";
import { DepartmentTable } from "./_components/department-table";
import { DepartmentDialog } from "./_components/department-dialog";
import { Pagination } from "@/components/ui/pagination";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";

const PAGE_SIZE = 20;

type Props = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: "asc" | "desc";
    page?: string;
  }>;
};

export default async function DepartmentsPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const { search, sort = "asc", page: pageParam } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("departments");

  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

  // Build where clause for reuse
  const whereClause = {
    organisationId: ctx.organisationId,
    active: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { alias: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  // Fetch departments with pagination
  const [departments, totalCount] = await Promise.all([
    db.department.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            employees: {
              where: { active: true },
            },
            managers: {
              where: { active: true },
            },
          },
        },
      },
      orderBy: {
        name: sort,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.department.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <Card className="space-y-4---">
      <CardHeader>
        <PageHeader
          title={t("title")}
          description={t("description")}
          action={<DepartmentDialog organisationAlias={organisationAlias} />}
        />

        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <DepartmentSearchBar />
        </Suspense>
      </CardHeader>

      <CardContent className="p-0">
        {departments.length === 0 && !search ? (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">{t("noDepartments")}</p>
            <div className="mt-4">
              <DepartmentDialog organisationAlias={organisationAlias} />
            </div>
          </div>
        ) : (
          <div className="p-4">
            <DepartmentTable
              departments={departments}
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
  );
}
