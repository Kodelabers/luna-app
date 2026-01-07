import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { ApplicationForm } from "../_components/application-form";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ organisationAlias: string }>;
};

export default async function NewApplicationPage(props: PageProps) {
  const params = await props.params;
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
    redirect(`/${params.organisationAlias}`);
  }

  // Check if user is a manager (GM or DM)
  const managerRecord = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      active: true,
      employee: {
        organisationId: ctx.organisationId,
      },
    },
    select: {
      departmentId: true,
    },
  });

  const isGeneralManager = managerRecord?.departmentId === null;
  const isDepartmentManager = managerRecord?.departmentId !== null && managerRecord?.departmentId !== undefined;

  // Fetch employees for manager selection
  let selectableEmployees: Array<{ id: string; firstName: string; lastName: string; email: string; departmentId: string | null }> = [];
  
  if (isGeneralManager) {
    // GM can create applications for any employee
    selectableEmployees = await db.employee.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });
  } else if (isDepartmentManager && managerRecord.departmentId) {
    // DM can create applications for employees in their department
    selectableEmployees = await db.employee.findMany({
      where: {
        organisationId: ctx.organisationId,
        departmentId: managerRecord.departmentId,
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        departmentId: true,
      },
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });
  }

  // Fetch unavailability reasons
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
      colorCode: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Note: Calendar data and pending applications will be fetched client-side
  // based on selected employee (default: current employee)

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-6">
        <PageHeader
          title={t("newApplication")}
          description={t("createDescription")}
        />

        <ApplicationForm
          organisationAlias={params.organisationAlias}
          reasons={reasons}
          currentEmployeeId={employee.id}
          selectableEmployees={selectableEmployees}
          isManager={isGeneralManager || isDepartmentManager}
          backHref={`/${params.organisationAlias}/applications`}
        />
      </div>
    </div>
  );
}

