import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant/resolveTenantContext";

export type ManagedDepartment = {
  id: number;
  name: string;
  alias: string;
};

/**
 * Get departments that the current user can manage
 * Returns departments where user is either:
 * - A department manager for that specific department
 * - A general manager (departmentId is null) - returns all departments
 */
export async function getManagedDepartments(
  ctx: TenantContext
): Promise<ManagedDepartment[]> {
  // Get employee for this user
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    return [];
  }

  // Get manager records for this employee
  const managers = await db.manager.findMany({
    where: {
      employeeId: employee.id,
      active: true,
    },
    select: {
      departmentId: true,
    },
  });

  if (managers.length === 0) {
    return [];
  }

  // Check if user is a general manager (departmentId is null)
  const isGeneralManager = managers.some((m) => m.departmentId === null);

  if (isGeneralManager) {
    // Return all active departments in the organisation
    return db.department.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        alias: true,
        colorCode: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  // Return only departments where user is a manager
  const departmentIds = managers
    .filter((m) => m.departmentId !== null)
    .map((m) => m.departmentId!);

  return db.department.findMany({
    where: {
      id: { in: departmentIds },
      organisationId: ctx.organisationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      alias: true,
      colorCode: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

