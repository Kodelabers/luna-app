import { Suspense } from "react";
import { resolveTenantContext, requireManagerAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SickLeavesTableClient from "./_components/sick-leaves-table-client";

type PageProps = {
  params: Promise<{
    organisationAlias: string;
  }>;
  searchParams: Promise<{
    status?: string;
    departmentId?: string;
    search?: string;
  }>;
};

async function SickLeavesData({
  organisationAlias,
  status,
  departmentId,
  search,
}: {
  organisationAlias: string;
  status?: string;
  departmentId?: string;
  search?: string;
}) {
  const ctx = await resolveTenantContext(organisationAlias);
  await requireManagerAccess(ctx);

  // Fetch all departments
  const departments = await db.department.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch employees for all departments or specific department
  const employeesWhere: any = {
    organisationId: ctx.organisationId,
    active: true,
  };
  if (departmentId) {
    employeesWhere.departmentId = departmentId;
  }

  const employees = await db.employee.findMany({
    where: employeesWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
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
    active: true,
  };

  // Default to OPENED if no status filter
  if (status) {
    where.status = status;
  } else {
    where.status = "OPENED";
  }

  if (departmentId) {
    where.departmentId = departmentId;
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
      department: {
        select: {
          id: true,
          name: true,
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
      departments={departments}
      sickLeaveReasons={sickLeaveReasons}
      organisationAlias={organisationAlias}
    />
  );
}

export default async function SickLeavesPage({ params, searchParams }: PageProps) {
  const { organisationAlias } = await params;
  const { status, departmentId, search } = await searchParams;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader title="Bolovanja" description="Upravljanje bolovanja u organizaciji" />

      <Card>
        <CardHeader>
          <CardTitle>Bolovanja</CardTitle>
          <CardDescription>
            Pregled i upravljanje bolovanja zaposlenika (default: aktivna bolovanja)
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
              status={status}
              departmentId={departmentId}
              search={search}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

