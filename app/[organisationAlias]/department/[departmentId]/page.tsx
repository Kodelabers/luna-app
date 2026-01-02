import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { getPlanningDataAction } from "@/lib/actions/planning";
import { DepartmentPlanningFilters } from "./_components/department-planning-filters";
import { PlanningTable } from "../../planning/_components/planning-table";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ organisationAlias: string; departmentId: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

export default async function DepartmentPage({ params, searchParams }: Props) {
  const { organisationAlias, departmentId } = await params;
  const { from, to } = await searchParams;
  const t = await getTranslations("planning");
  const ctx = await resolveTenantContext(organisationAlias);

  const deptId = parseInt(departmentId, 10);
  if (isNaN(deptId)) {
    notFound();
  }

  // Check department access
  await requireDepartmentAccess(ctx, deptId);

  // Fetch department with managers
  const department = await db.department.findFirst({
    where: {
      id: deptId,
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      employees: {
        where: { active: true },
        select: { id: true },
      },
      managers: {
        where: { active: true },
        include: {
          employee: true,
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  // Determine date range (default: 1 month from today)
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const defaultTo = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  defaultTo.setMonth(defaultTo.getMonth() + 1);

  const fromLocalISO = from || format(defaultFrom, "yyyy-MM-dd");
  const toLocalISO = to || format(defaultTo, "yyyy-MM-dd");

  // Get client timezone (TODO: get from user preferences)
  const clientTimeZone = "Europe/Zagreb";

  // Fetch planning data for this department only
  const result = await getPlanningDataAction(
    organisationAlias,
    fromLocalISO,
    toLocalISO,
    clientTimeZone,
    [deptId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
        {department.description && (
          <p className="text-muted-foreground">{department.description}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Department info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacije o odjelu</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Alias:</dt>
                <dd>
                  <Badge variant="outline">{department.alias}</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Broj zaposlenika:</dt>
                <dd className="font-medium">{department.employees.length}</dd>
              </div>
              {department.colorCode && (
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Boja:</dt>
                  <dd className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: department.colorCode }}
                    />
                    {department.colorCode}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Managers */}
        <Card>
          <CardHeader>
            <CardTitle>Manageri odjela</CardTitle>
            <CardDescription>Osobe odgovorne za odobrenja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {department.managers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nema dodijeljenih managera.
              </p>
            ) : (
              <ul className="space-y-2">
                {department.managers.map((manager) => (
                  <li key={manager.id} className="flex items-center justify-between text-sm">
                    <span>
                      {manager.employee.firstName} {manager.employee.lastName}
                    </span>
                    <Badge variant="secondary">Manager</Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-2 border-t">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/${organisationAlias}/department/${deptId}/employees`}>
                  <Users className="mr-2 h-4 w-4" />
                  Pogledaj sve zaposlenike ({department.employees.length})
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("planningTable")}</CardTitle>
          <CardDescription>
            {result.success
              ? t("planningTableDescription", {
                  employeeCount: result.data.employees.length,
                  dayCount: result.data.days.length,
                })
              : "Greška pri dohvaćanju podataka"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DepartmentPlanningFilters
            fromLocalISO={fromLocalISO}
            toLocalISO={toLocalISO}
            clientTimeZone={clientTimeZone}
            organisationAlias={organisationAlias}
            departmentId={deptId}
          />
          {result.success ? (
            <PlanningTable data={result.data} organisationAlias={organisationAlias} />
          ) : (
            <p className="text-destructive">{result.formError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
