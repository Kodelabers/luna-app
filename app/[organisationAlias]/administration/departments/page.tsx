import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentSearchBar } from "./_components/department-search-bar";
import { DepartmentTable } from "./_components/department-table";
import { DepartmentDialog } from "./_components/department-dialog";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{ search?: string; sort?: "asc" | "desc" }>;
};

export default async function DepartmentsPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const { search, sort = "asc" } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("departments");

  // Fetch departments for this organisation with search and sort
  const departments = await db.department.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { alias: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
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
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <DepartmentDialog organisationAlias={organisationAlias} />
      </div>

      <div className="flex items-center justify-between">
        <Suspense fallback={<Skeleton className="h-10 w-64" />}>
          <DepartmentSearchBar />
        </Suspense>
      </div>

      <Card>
        <CardContent className="p-0">
          {departments.length === 0 && !search ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                {t("noDepartments")}
              </p>
              <div className="mt-4">
                <DepartmentDialog organisationAlias={organisationAlias} />
              </div>
            </div>
          ) : (
            <DepartmentTable
              departments={departments}
              organisationAlias={organisationAlias}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
