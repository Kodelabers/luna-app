import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { resolveTenantContext, getManagerStatus } from "@/lib/tenant/resolveTenantContext";
import { getManagedDepartments } from "@/lib/services/sidebar";
import { getPlanningDataAction } from "@/lib/actions/planning";
import { PlanningFilters as PlanningFiltersClient } from "./_components/planning-filters";
import { PlanningTable as PlanningTableClient } from "./_components/planning-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, addMonths, format } from "date-fns";

type Props = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    department?: string; // comma-separated department IDs
  }>;
};

export default async function PlanningPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const { from, to, department } = await searchParams;
  const t = await getTranslations("planning");

  // 1. Resolve tenant context
  const ctx = await resolveTenantContext(organisationAlias);

  // 2. Check manager access
  const managerStatus = await getManagerStatus(ctx);
  if (!managerStatus.isGeneralManager && !managerStatus.isDepartmentManager) {
    redirect(`/${organisationAlias}`);
  }

  // 3. Get managed departments for filter
  const managedDepartments = await getManagedDepartments(ctx);

  // 4. Determine date range (default: 1 month from today, not from start of month)
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const defaultTo = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  defaultTo.setMonth(defaultTo.getMonth() + 1);

  const fromLocalISO = from || format(defaultFrom, "yyyy-MM-dd");
  const toLocalISO = to || format(defaultTo, "yyyy-MM-dd");
  
  // Parse comma-separated department IDs
  const departmentIds: number[] = department
    ? department
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id) && id > 0)
    : [];

  // Validate departmentIds if provided
  const validDepartmentIds: number[] = [];
  if (departmentIds.length > 0) {
    for (const deptId of departmentIds) {
      if (managerStatus.isGeneralManager) {
        // GM can access any department in organisation
        const dept = managedDepartments.find((d) => d.id === deptId);
        if (dept) {
          validDepartmentIds.push(deptId);
        }
      } else {
        // DM can only access managed departments
        if (managerStatus.managedDepartmentIds.includes(deptId)) {
          validDepartmentIds.push(deptId);
        }
      }
    }
  }

  // 5. Get client timezone (TODO: get from user preferences)
  const clientTimeZone = "Europe/Zagreb";

  // 6. Fetch planning data
  const result = await getPlanningDataAction(
    organisationAlias,
    fromLocalISO,
    toLocalISO,
    clientTimeZone,
    validDepartmentIds.length > 0 ? validDepartmentIds : undefined
  );

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{result.formError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const planningData = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
          <CardDescription>{t("filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanningFiltersClient
            fromLocalISO={fromLocalISO}
            toLocalISO={toLocalISO}
            departmentIds={validDepartmentIds}
            departments={managedDepartments.map((d) => ({
              id: d.id,
              name: d.name,
              colorCode: (d as any).colorCode ?? null,
            }))}
            isGeneralManager={managerStatus.isGeneralManager}
            clientTimeZone={clientTimeZone}
            organisationAlias={organisationAlias}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("planningTable")}</CardTitle>
          <CardDescription>
            {t("planningTableDescription", {
              employeeCount: planningData.employees.length,
              dayCount: planningData.days.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <PlanningTableClient data={planningData} organisationAlias={organisationAlias} />
        </CardContent>
      </Card>
    </div>
  );
}

