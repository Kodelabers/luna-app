import { Suspense } from "react";
import { resolveTenantContext, requireManagerAccess } from "@/lib/tenant/resolveTenantContext";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import SickLeavesTableClient from "./_components/sick-leaves-table-client";
import OpenSickLeaveDialog from "./_components/open-sick-leave-dialog";

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

// Async component for the dialog (needs employees, departments, and sick leave reasons)
async function OpenSickLeaveDialogWrapper({
  organisationAlias,
}: {
  organisationAlias: string;
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

  // Fetch all employees
  const employees = await db.employee.findMany({
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

  return (
    <OpenSickLeaveDialog
      employees={employees}
      departments={departments}
      sickLeaveReasons={sickLeaveReasons}
      organisationAlias={organisationAlias}
    />
  );
}

// Async component for table data
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

  // Fetch all departments for filter
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

  // Build filters for sick leaves
  const where: any = {
    organisationId: ctx.organisationId,
    active: true,
  };

  // Filter by status (default to OPENED, "all" shows everything)
  if (status && status !== "all") {
    where.status = status;
  } else if (!status) {
    where.status = "OPENED";
  }
  // If status === "all", don't add status filter (show all)

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
      departments={departments}
      organisationAlias={organisationAlias}
    />
  );
}

export default async function SickLeavesPage({ params, searchParams }: PageProps) {
  const { organisationAlias } = await params;
  const { status, departmentId, search } = await searchParams;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Bolovanja"
        description="Upravljanje bolovanja u organizaciji"
        action={
          <Suspense fallback={<Button disabled>Otvori bolovanje</Button>}>
            <OpenSickLeaveDialogWrapper organisationAlias={organisationAlias} />
          </Suspense>
        }
      />

      <Card>
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

