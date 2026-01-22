import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UnavailabilityReasonSearchBar } from "./_components/unavailability-reason-search-bar";
import { UnavailabilityReasonTable } from "./_components/unavailability-reason-table";
import { UnavailabilityReasonDialog } from "./_components/unavailability-reason-dialog";
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
  }>;
};

export default async function UnavailabilityReasonsPage({
  params,
  searchParams,
}: Props) {
  const { organisationAlias } = await params;
  const { search, sort = "asc", page: pageParam } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("unavailabilityReasons");

  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));

  // Build where clause for reuse
  const whereClause = {
    organisationId: ctx.organisationId,
    active: true,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  // Fetch unavailability reasons with pagination
  const [reasons, totalCount] = await Promise.all([
    db.unavailabilityReason.findMany({
      where: whereClause,
      orderBy: {
        name: sort,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.unavailabilityReason.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <PageHeader
            title={t("title")}
            description={t("description")}
            action={
              <UnavailabilityReasonDialog organisationAlias={organisationAlias} />
            }
          />

          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <UnavailabilityReasonSearchBar />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0">
          {reasons.length === 0 && !search ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{t("noReasons")}</p>
              <div className="mt-4">
                <UnavailabilityReasonDialog organisationAlias={organisationAlias} />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <UnavailabilityReasonTable
                reasons={reasons}
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
