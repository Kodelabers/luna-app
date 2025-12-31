import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { resolveTenantContext, getEmployeeForUser } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError } from "@/lib/errors";
import { DaysBalanceClient } from "./_components/days-balance-client";

type PageProps = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function ProfilePage(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations("profile");

  // Resolve tenant context
  const ctx = await resolveTenantContext(params.organisationAlias);

  // Get employee
  const employee = await getEmployeeForUser(ctx);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          Nemate Employee profil u ovoj organizaciji
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <Suspense fallback={<div>Učitavanje...</div>}>
        <DaysBalanceClient organisationAlias={params.organisationAlias} />
      </Suspense>
    </div>
  );
}

