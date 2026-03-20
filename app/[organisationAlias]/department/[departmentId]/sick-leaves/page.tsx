import { Suspense } from "react";
import { notFound } from "next/navigation";
import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import SickLeavesTableClient from "./_components/sick-leaves-table-client";
import OpenSickLeaveDialog from "./_components/open-sick-leave-dialog";

type PageProps = {
  params: Promise<{
    organisationAlias: string;
    departmentId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
};

// Async component for the dialog (needs employees and sick leave reasons)
async function OpenSickLeaveDialogWrapper({
  organisationAlias,
  departmentId,
}: {
  organisationAlias: string;
  departmentId: string;
}) {
  const ctx = await resolveTenantContext(organisationAlias);
  await requireDepartmentAccess(ctx, departmentId);

  // Fetch employees for this department
  const employees = await db.employee.findMany({
    where: {
      departmentId: departmentId,
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Fetch unavailability reasons that are sick leave types
  const sickLeaveReasons = await db.unavailabilityReason.findMany({
    where: {
      organisationId: ctx.organisationId,
      sickLeave: true,
      active: true,
    },
    select: {
      id: true,
      name: true,
      colorCode: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <OpenSickLeaveDialog
      employees={employees}
      sickLeaveReasons={sickLeaveReasons}
      organisationAlias={organisationAlias}
      departmentId={departmentId}
    />
  );
}

// Async component for table data
async function SickLeavesData({
  organisationAlias,
  departmentId,
  status,
  search,
}: {
  organisationAlias: string;
  departmentId: string;
  status?: string;
  search?: string;
}) {
  const ctx = await resolveTenantContext(organisationAlias);
  await requireDepartmentAccess(ctx, departmentId);

  // Fetch department
  const department = await db.department.findFirst({
    where: {
      id: departmentId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!department) {
    notFound();
  }

  // Build filters for sick leaves
  const where: any = {
    organisationId: ctx.organisationId,
    departmentId: departmentId,
    active: true,
  };

  // Filter by status (default to OPENED, "all" shows everything)
  if (status && status !== "all") {
    where.status = status;
  } else if (!status) {
    where.status = "OPENED";
  }
  // If status === "all", don't add status filter (show all)

  // Fetch sick leaves
  const sickLeaves = await db.sickLeave.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      unavailabilityReason: {
        select: {
          id: true,
          name: true,
          colorCode: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  // Filter by search if provided
  let filteredSickLeaves = sickLeaves;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredSickLeaves = sickLeaves.filter(
      (sl) =>
        sl.employee.firstName.toLowerCase().includes(searchLower) ||
        sl.employee.lastName.toLowerCase().includes(searchLower) ||
        sl.employee.email.toLowerCase().includes(searchLower)
    );
  }

  return (
    <SickLeavesTableClient
      sickLeaves={filteredSickLeaves}
      organisationAlias={organisationAlias}
    />
  );
}

export default async function DepartmentSickLeavesPage({ params, searchParams }: PageProps) {
  const { organisationAlias, departmentId } = await params;
  const { status, search } = await searchParams;
  const t = await getTranslations("sickLeave");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <PageHeader
            title={t("title")}
            description={t("description")}
            action={
              <Suspense fallback={<Button disabled>{t("openNew")}</Button>}>
                <OpenSickLeaveDialogWrapper
                  organisationAlias={organisationAlias}
                  departmentId={departmentId}
                />
              </Suspense>
            }
          />
        </CardHeader>

        <CardContent>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <SickLeavesData
              organisationAlias={organisationAlias}
              departmentId={departmentId}
              status={status}
              search={search}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

