import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/integrations/clerk";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { Organisation, OrganisationUser, User, UserRole } from "@prisma/client";

/**
 * Tenant context returned by resolveTenantContext
 */
export type TenantContext = {
  organisationId: string;
  organisation: Organisation;
  user: User;
  organisationUser: OrganisationUser & {
    roles: UserRole[];
  };
};

/**
 * Resolve tenant context from organisation alias
 * 
 * Per spec:
 * - 404 if organisation doesn't exist or active = false
 * - 403 if membership (OrganisationUser) doesn't exist or active = false
 * - Before membership check, ensure local User exists (Clerk upsert)
 */
export async function resolveTenantContext(
  organisationAlias: string
): Promise<TenantContext> {
  // 1. Get current user (ensures local User exists via Clerk upsert)
  const user = await getCurrentUser();

  // 2. Find organisation by alias
  const organisation = await db.organisation.findUnique({
    where: {
      alias: organisationAlias,
      active: true,
    },
  });

  if (!organisation) {
    throw new NotFoundError("Organizacija nije pronađena");
  }

  // 3. Check membership
  const organisationUser = await db.organisationUser.findFirst({
    where: {
      organisationId: organisation.id,
      userId: user.id,
      active: true,
    },
  });

  if (!organisationUser) {
    throw new ForbiddenError("Nemate pristup ovoj organizaciji");
  }

  return {
    organisationId: organisation.id,
    organisation,
    user,
    organisationUser,
  };
}

/**
 * Check if user has ADMIN role in the organisation
 */
export function isAdmin(ctx: TenantContext): boolean {
  return ctx.organisationUser.roles.includes("ADMIN");
}

/**
 * Require ADMIN role - throws ForbiddenError if not admin
 */
export function requireAdmin(ctx: TenantContext): void {
  if (!isAdmin(ctx)) {
    throw new ForbiddenError("Potrebna je administratorska uloga");
  }
}

/**
 * Check if user has access to a specific department
 * Either as department manager or as general manager
 */
export async function hasDepartmentAccess(
  ctx: TenantContext,
  departmentId: string
): Promise<boolean> {
  // First verify department belongs to this organisation
  const department = await db.department.findFirst({
    where: {
      id: departmentId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!department) {
    return false;
  }

  // Get employee for this user in this organisation
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    return false;
  }

  // Check if user is a manager for this department or a general manager
  const manager = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      active: true,
      OR: [
        { departmentId: departmentId }, // Department manager
        { departmentId: null }, // General manager (access to all departments)
      ],
    },
  });

  return !!manager;
}

/**
 * Require access to a specific department - throws ForbiddenError if no access
 */
export async function requireDepartmentAccess(
  ctx: TenantContext,
  departmentId: string
): Promise<void> {
  const hasAccess = await hasDepartmentAccess(ctx, departmentId);
  if (!hasAccess) {
    throw new ForbiddenError("Nemate pristup ovom odjelu");
  }
}

/**
 * Get employee profile for current user in this organisation
 */
export async function getEmployeeForUser(ctx: TenantContext) {
  return db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });
}

/**
 * Get manager status for current user (UC-DASH-01)
 * Returns flags for general manager and department manager roles
 */
export async function getManagerStatus(ctx: TenantContext): Promise<{
  isGeneralManager: boolean;
  isDepartmentManager: boolean;
  managedDepartmentIds: string[];
}> {
  const employee = await getEmployeeForUser(ctx);

  if (!employee) {
    return {
      isGeneralManager: false,
      isDepartmentManager: false,
      managedDepartmentIds: [],
    };
  }

  // Get all active manager records for this employee
  const managers = await db.manager.findMany({
    where: {
      employeeId: employee.id,
      active: true,
    },
    select: {
      departmentId: true,
    },
  });

  const isGeneralManager = managers.some((m) => m.departmentId === null);
  const managedDepartmentIds = managers
    .filter((m) => m.departmentId !== null)
    .map((m) => m.departmentId!);

  return {
    isGeneralManager,
    isDepartmentManager: managedDepartmentIds.length > 0,
    managedDepartmentIds,
  };
}

/**
 * Check if user has manager access (DM or GM), optionally for a specific department
 * For sick-leave operations: requireManagerAccess(ctx, departmentId)
 */
export async function requireManagerAccess(
  ctx: TenantContext,
  departmentId?: string
): Promise<void> {
  // Check if user has an employee profile
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Nemate pristup kao manager");
  }

  // Check if user is a manager
  const manager = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      active: true,
      OR: [
        { departmentId: null }, // GM
        ...(departmentId ? [{ departmentId }] : []), // DM for specific department
      ],
    },
  });

  if (!manager) {
    throw new ForbiddenError("Nemate pristup kao manager");
  }
}

