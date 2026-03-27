import { resolveTenantContext, getManagerStatus, getEmployeeForUser } from "@/lib/tenant/resolveTenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import {
  getOpenApplicationsForEmployee,
  getDmApprovalQueues,
  getGmApprovalQueue,
} from "@/lib/services/dashboard";
import { getEmployeeMonthCalendar } from "@/lib/services/calendar";
import { OpenRequestsCard } from "./_components/dashboard/open-requests-card";
import { DmApprovalCard } from "./_components/dashboard/dm-approval-card";
import { GmApprovalCard } from "./_components/dashboard/gm-approval-card";
import { MultiMonthCalendarCard } from "./_components/dashboard/multi-month-calendar-card";

type Props = {
  params: Promise<{ organisationAlias: string }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function DashboardPage({ params, searchParams }: Props) {
  const { organisationAlias } = await params;
  const { month: monthParam, year: yearParam } = await searchParams;
  
  const ctx = await resolveTenantContext(organisationAlias);
  const managerStatus = await getManagerStatus(ctx);
  const employee = await getEmployeeForUser(ctx);
  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");

  // Get current month/year or use query params
  const now = new Date();
  const currentMonth = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  const currentYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const clientTimeZone = "Europe/Zagreb"; // TODO: Get from user preferences

  // Fetch dashboard data
  let openApplications: Awaited<ReturnType<typeof getOpenApplicationsForEmployee>> = [];
  let dmQueues: Awaited<ReturnType<typeof getDmApprovalQueues>> = { submitted: [], awaitingGm: [] };
  let gmQueue: Awaited<ReturnType<typeof getGmApprovalQueue>> = [];
  let calendarDays: Awaited<ReturnType<typeof getEmployeeMonthCalendar>> = [];

  if (employee) {
    // Employee's open requests
    openApplications = await getOpenApplicationsForEmployee(ctx, employee.id, clientTimeZone);

    // Employee's calendar - fetch 12 months for multi-month display
    calendarDays = await getEmployeeMonthCalendar(ctx, {
      employeeId: employee.id,
      month: currentMonth,
      year: currentYear,
      clientTimeZone,
      numberOfMonths: 12,
    });
  }

  // DM queues
  if (managerStatus.isDepartmentManager) {
    dmQueues = await getDmApprovalQueues(ctx, managerStatus.managedDepartmentIds);
  }

  // GM queue
  if (managerStatus.isGeneralManager) {
    gmQueue = await getGmApprovalQueue(ctx);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
          <Badge variant="secondary">{tRoles("administrator")}</Badge>
        )}
        {managerStatus.isGeneralManager && (
          <Badge variant="secondary">{tRoles("generalManager")}</Badge>
        )}
        {managerStatus.isDepartmentManager && (
          <Badge variant="secondary">{tRoles("departmentManager")}</Badge>
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
        {employee && <OpenRequestsCard applications={openApplications} />}

        {/* Requests to approve - for department managers */}
        {managerStatus.isDepartmentManager && (
          <DmApprovalCard queues={dmQueues} organisationAlias={organisationAlias} />
        )}

        {/* Requests to approve - for general manager */}
        {managerStatus.isGeneralManager && (
          <GmApprovalCard applications={gmQueue} organisationAlias={organisationAlias} />
        )}

        {/* Calendar */}
        {employee && calendarDays.length > 0 && (
          <MultiMonthCalendarCard
            calendarDays={calendarDays}
            month={currentMonth}
            year={currentYear}
            pendingApplications={openApplications}
            clientTimeZone={clientTimeZone}
          />
        )}
      </div>
    </div>
  );
}

