import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ManagerSection } from "./_components/manager-section";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function ManagersPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const t = await getTranslations("managers");

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

  return (
    <Card>
      <CardHeader>
        <PageHeader title={t("title")} description={t("description")} />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* General Managers Section */}
        <ManagerSection
          title={t("generalManagers")}
          managers={generalManagers}
          organisationAlias={organisationAlias}
          isGeneral
        />

        {/* Department Sections */}
        {departments.map((department) => (
          <ManagerSection
            key={department.id}
            title={department.name}
            departmentId={department.id}
            managers={department.managers}
            organisationAlias={organisationAlias}
            colorCode={department.colorCode}
          />
        ))}
      </CardContent>
    </Card>
  );
}

