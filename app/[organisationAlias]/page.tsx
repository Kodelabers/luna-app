import { resolveTenantContext, getManagerStatus, getEmployeeForUser } from "@/lib/tenant/resolveTenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { organisationAlias } = await params;
  const ctx = await resolveTenantContext(organisationAlias);
  const managerStatus = await getManagerStatus(ctx);
  const employee = await getEmployeeForUser(ctx);
  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("welcome", { name: ctx.user.firstName })}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboardFor", { organisation: ctx.organisation.name })}
        </p>
      </div>

      {/* Role badges */}
      <div className="flex gap-2">
        {ctx.organisationUser.roles.includes("ADMIN") && (
          <Badge variant="default">{tRoles("administrator")}</Badge>
        )}
        {managerStatus.isGeneralManager && (
          <Badge variant="secondary">{tRoles("generalManager")}</Badge>
        )}
        {managerStatus.isDepartmentManager && (
          <Badge variant="outline">{tRoles("departmentManager")}</Badge>
        )}
      </div>

      {/* Dashboard widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Employee profile status */}
        {employee ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("myProfile")}</CardTitle>
              <CardDescription>{t("yourDataInSystem")}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("fullName")}</dt>
                  <dd className="font-medium">{employee.firstName} {employee.lastName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("email")}</dt>
                  <dd className="font-medium">{employee.email}</dd>
                </div>
                {employee.title && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("position")}</dt>
                    <dd className="font-medium">{employee.title}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("myProfile")}</CardTitle>
              <CardDescription>{t("notLinkedToEmployee")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("contactAdmin")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Open requests - for employees */}
        {employee && (
          <Card>
            <CardHeader>
              <CardTitle>{t("myRequests")}</CardTitle>
              <CardDescription>{t("openRequests")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("openRequestsDescription")}
              </p>
              {/* TODO: Implement UC-DASH-03.1 */}
            </CardContent>
          </Card>
        )}

        {/* Requests to approve - for department managers */}
        {managerStatus.isDepartmentManager && (
          <Card>
            <CardHeader>
              <CardTitle>{t("forApproval")}</CardTitle>
              <CardDescription>{t("requestsAwaitingDecision")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("requestsAwaitingDescription")}
              </p>
              {/* TODO: Implement UC-DASH-03.2 */}
            </CardContent>
          </Card>
        )}

        {/* Requests to approve - for general manager */}
        {managerStatus.isGeneralManager && (
          <Card>
            <CardHeader>
              <CardTitle>{t("finalApproval")}</CardTitle>
              <CardDescription>{t("requestsForFinalApproval")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("finalApprovalDescription")}
              </p>
              {/* TODO: Implement UC-DASH-03.3 */}
            </CardContent>
          </Card>
        )}

        {/* Calendar placeholder */}
        {employee && (
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>{t("myCalendar")}</CardTitle>
              <CardDescription>{t("scheduleForCurrentMonth")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("calendarDescription")}
              </p>
              {/* TODO: Implement UC-DASH-02 */}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

