import { Suspense } from "react";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HolidaySearchBar } from "./_components/holiday-search-bar";
import { HolidayTable } from "./_components/holiday-table";
import { HolidayDialog } from "./_components/holiday-dialog";
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
    type?: "yearly" | "oneTime";
    year?: string;
  }>;
};

export default async function HolidaysPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const currentYear = new Date().getFullYear();
  const {
    search,
    sort = "asc",
    page: pageParam,
    type,
    year: yearParam,
  } = await searchParams;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("holidays");

  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const selectedYear = parseInt(yearParam || currentYear.toString(), 10);

  // Build date range for the selected year (for one-time holidays)
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

  // Build where clause for reuse
  // For yearly holidays, we show all (they repeat every year)
  // For one-time holidays, we filter by the selected year
  const whereClause = {
    organisationId: ctx.organisationId,
    active: true,
    ...(type === "yearly" && { repeatYearly: true }),
    ...(type === "oneTime" && {
      repeatYearly: false,
      date: { gte: yearStart, lte: yearEnd },
    }),
    ...(!type && {
      OR: [
        { repeatYearly: true },
        { repeatYearly: false, date: { gte: yearStart, lte: yearEnd } },
      ],
    }),
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  // Fetch holidays and count in parallel
  const [holidays, totalCount] = await Promise.all([
    db.holiday.findMany({
      where: whereClause,
      orderBy: {
        date: sort,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.holiday.count({
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
            action={<HolidayDialog organisationAlias={organisationAlias} />}
          />

          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <HolidaySearchBar />
          </Suspense>
        </CardHeader>

        <CardContent className="p-0">
          {holidays.length === 0 && !search && !type && !yearParam ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">{t("noHolidays")}</p>
              <div className="mt-4">
                <HolidayDialog organisationAlias={organisationAlias} />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <HolidayTable
                holidays={holidays}
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
