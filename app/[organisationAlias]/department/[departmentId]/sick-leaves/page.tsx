import { Suspense } from "react";
import { notFound } from "next/navigation";
import { resolveTenantContext, requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SickLeavesTableClient from "./_components/sick-leaves-table-client";

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

  // Build filters for sick leaves
  const where: any = {
    organisationId: ctx.organisationId,
    departmentId: departmentId,
    active: true,
  };

  if (status) {
    where.status = status;
  }

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
      employees={employees}
      sickLeaveReasons={sickLeaveReasons}
      organisationAlias={organisationAlias}
      departmentId={departmentId}
      department={department}
    />
  );
}

export default async function DepartmentSickLeavesPage({ params, searchParams }: PageProps) {
  const { organisationAlias, departmentId } = await params;
  const { status, search } = await searchParams;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Bolovanja"
        description="Upravljanje bolovanja zaposlenika odjela"
      />

      <Card>
        <CardHeader>
          <CardTitle>Bolovanja</CardTitle>
          <CardDescription>
            Pregled i upravljanje bolovanja zaposlenika
          </CardDescription>
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

