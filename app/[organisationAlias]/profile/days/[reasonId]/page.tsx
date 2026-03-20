import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { resolveTenantContext, getEmployeeForUser } from "@/lib/tenant/resolveTenantContext";
import { NotFoundError } from "@/lib/errors";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DaysBalanceByYearClient } from "./_components/days-balance-by-year-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ organisationAlias: string; reasonId: string }>;
};

export default async function DaysBalanceByYearPage(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("daysBalance");
  const tCommon = await getTranslations("common");
  const tErrors = await getTranslations("errors");

  // Resolve tenant context
  const ctx = await resolveTenantContext(params.organisationAlias);

  // Get employee
  const employee = await getEmployeeForUser(ctx);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          {tErrors("noEmployeeProfile")}
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
    },
  });

  if (!reason) {
    throw new NotFoundError(tErrors("reasonNotFound"));
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex items-center  gap-4">

          <Link href={`/${params.organisationAlias}/profile`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title={`${t("title")} - ${reason.name}`}
            description={t("byYearDescription")}
          />
          <div className="flex flex-1 justify-end items-center gap-2">
          <div style={{ backgroundColor: reason.colorCode ?? undefined }} className="h-4 w-4 rounded-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>{tCommon("loading")}</div>}>
            <DaysBalanceByYearClient
              organisationAlias={params.organisationAlias}
              unavailabilityReasonId={reasonId}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

