import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ApplicationsListClient } from "./_components/applications-list-client";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ApplicationsPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations("applications");

  // Resolve tenant context
  const ctx = await resolveTenantContext(params.organisationAlias);

  // Get employee
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          Nemate Employee profil u ovoj organizaciji
        </p>
      </div>
    );
  }

  // Fetch unavailability reasons for filters
  const reasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      needApproval: true,
      needSecondApproval: true,
      hasPlanning: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <PageHeader
            title={t("myApplications")}
            description={t("description")}
            action={
              <Link href={`/${params.organisationAlias}/applications/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("newApplication")}
                </Button>
              </Link>
            }
          />
        </CardHeader>
        <CardContent>

          <Suspense fallback={<div>Loading...</div>}>
            <ApplicationsListClient
              organisationAlias={params.organisationAlias}
              reasons={reasons}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

