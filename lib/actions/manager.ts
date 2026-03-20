"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import { createManagerSchema } from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";

/**
 * Create a new manager
 * If departmentId is null/undefined, creates a General Manager
 * If departmentId is provided, creates a Department Manager
 */
export async function createManager(
  organisationAlias: string,
  employeeId: string,
  departmentId?: string | null
): Promise<FormState> {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2b7332b-7e97-456c-84b1-92faf4f81900',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manager.ts:createManager:entry',message:'createManager called',data:{organisationAlias,employeeId,departmentId,departmentIdType:typeof departmentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    const tErr = await getTranslations("errors");
    const tMsg = await getTranslations("messages");
    const tMgr = await getTranslations("managers");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Validate input
    const tVal = await getTranslations("validation");
    const result = createManagerSchema(tVal).safeParse({ employeeId, departmentId });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2b7332b-7e97-456c-84b1-92faf4f81900',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manager.ts:createManager:validation',message:'Schema validation result',data:{success:result.success,errors:result.success?null:result.error.issues},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    // Check if employee exists and belongs to organisation
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      throw new NotFoundError(tErr("employeeNotFound"));
    }

    // If departmentId provided, verify it belongs to organisation
    if (departmentId) {
      const department = await db.department.findFirst({
        where: {
          id: departmentId,
          organisationId: ctx.organisationId,
          active: true,
        },
      });

      if (!department) {
        throw new NotFoundError(tMsg("departmentNotFound"));
      }

      // Check if employee is already manager of this department
      const existingDeptManager = await db.manager.findFirst({
        where: {
          employeeId,
          departmentId,
          active: true,
        },
      });

      if (existingDeptManager) {
        throw new ConflictError(tMgr("alreadyManagerOfDepartment"));
      }
    } else {
      // Check if employee is already a general manager
      const existingGeneralManager = await db.manager.findFirst({
        where: {
          employeeId,
          departmentId: null,
          active: true,
        },
      });

      if (existingGeneralManager) {
        throw new ConflictError(tMgr("alreadyGeneralManager"));
      }
    }

    // Create manager
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2b7332b-7e97-456c-84b1-92faf4f81900',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manager.ts:createManager:beforeCreate',message:'About to create manager',data:{employeeId,departmentId,departmentIdForDb:departmentId||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    await db.manager.create({
      data: {
        employeeId,
        departmentId: departmentId || null,
      },
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2b7332b-7e97-456c-84b1-92faf4f81900',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manager.ts:createManager:afterCreate',message:'Manager created successfully',data:{employeeId,departmentId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    revalidatePath(`/${organisationAlias}/administration/managers`);
    return successState(tMgr("managerAdded"));
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2b7332b-7e97-456c-84b1-92faf4f81900',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manager.ts:createManager:error',message:'Error caught',data:{errorName:(error as Error)?.name,errorMessage:(error as Error)?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return await mapErrorToFormState(error);
  }
}

/**
 * Delete (soft delete) a manager
 */
export async function deleteManager(
  organisationAlias: string,
  managerId: string
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Check manager exists and employee belongs to organisation
    const manager = await db.manager.findFirst({
      where: {
        id: managerId,
        active: true,
        employee: {
          organisationId: ctx.organisationId,
        },
      },
    });

    if (!manager) {
      const tMgr = await getTranslations("managers");
      throw new NotFoundError(tMgr("notFound"));
    }

    // Soft delete
    await db.manager.update({
      where: { id: managerId },
      data: { active: false },
    });

    revalidatePath(`/${organisationAlias}/administration/managers`);
    const tMgr = await getTranslations("managers");
    return successState(tMgr("managerRemoved"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Search employees for adding as manager
 * Excludes employees who are already managers of the specified department
 * Or excludes employees who are already general managers (if departmentId is null)
 */
export async function searchEmployeesForManager(
  organisationAlias: string,
  query: string,
  departmentId?: string | null
): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    if (!query || query.length < 2) {
      return [];
    }

    // Get IDs of employees who are already managers of this department/general
    const existingManagers = await db.manager.findMany({
      where: {
        active: true,
        departmentId: departmentId ?? null,
        employee: {
          organisationId: ctx.organisationId,
        },
      },
      select: {
        employeeId: true,
      },
    });

    const excludeIds = existingManagers.map((m) => m.employeeId);

    // Search employees
    const employees = await db.employee.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
        id: {
          notIn: excludeIds.length > 0 ? excludeIds : undefined,
        },
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 10,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return employees;
  } catch (error) {
    console.error("Error searching employees for manager:", error);
    return [];
  }
}

const PAGE_SIZE = 20;

type PaginatedEmployeesResult = {
  employees: { id: string; firstName: string; lastName: string; email: string }[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

/**
 * Get all employees for adding as manager with pagination
 * Excludes employees who are already managers of the specified department
 * Or excludes employees who are already general managers (if departmentId is null)
 */
export async function getEmployeesForManager(
  organisationAlias: string,
  page: number = 1,
  departmentId?: string | null
): Promise<PaginatedEmployeesResult> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Get IDs of employees who are already managers of this department/general
    const existingManagers = await db.manager.findMany({
      where: {
        active: true,
        departmentId: departmentId ?? null,
        employee: {
          organisationId: ctx.organisationId,
        },
      },
      select: {
        employeeId: true,
      },
    });

    const excludeIds = existingManagers.map((m) => m.employeeId);

    const whereClause = {
      organisationId: ctx.organisationId,
      active: true,
      ...(excludeIds.length > 0 && {
        id: {
          notIn: excludeIds,
        },
      }),
    };

    // Get total count and employees in parallel
    const [totalCount, employees] = await Promise.all([
      db.employee.count({ where: whereClause }),
      db.employee.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

    return {
      employees,
      totalCount,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error getting employees for manager:", error);
    return {
      employees: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

