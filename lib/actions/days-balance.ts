"use server";

import { revalidatePath } from "next/cache";
import { resolveTenantContext, getManagerStatus, getEmployeeForUser, isAdmin } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError, FormState, mapErrorToFormState, successState } from "@/lib/errors";
import { toZonedTime } from "date-fns-tz";
import {
  getDaysBalanceForEmployee,
  getDaysBalanceByYear,
  getDaysBalanceForManager,
  getLedgerHistory,
  allocateDays,
  updateAllocation,
  getOpenYear,
} from "@/lib/services/days-balance";
import { allocateDaysSchema, updateAllocationSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";

/**
 * Get my days balance (UC-DAYS-01)
 */
export async function getMyDaysBalanceAction(
  organisationAlias: string,
  currentYear?: number
): Promise<{
  balances: Array<{
    unavailabilityReasonId: string;
    unavailabilityReasonName: string;
    unavailabilityReasonColorCode: string | null;
    openYear: number | null;
    openYearBalance: number | null;
    breakdown: {
      allocated: number;
      used: number;
      pending: number;
      remaining: number;
      balance: number;
      totalAvailable: number;
    };
  }>;
}> {
  const ctx = await resolveTenantContext(organisationAlias);

  // Get employee for current user
  const employee = await getEmployeeForUser(ctx);

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  // Get current year in client timezone (default to Europe/Zagreb if not provided)
  const clientTimeZone = "Europe/Zagreb"; // TODO: get from user preferences or browser
  const now = new Date();
  const defaultYear = toZonedTime(now, clientTimeZone).getFullYear();
  const year = currentYear ?? defaultYear;

  const balances = await getDaysBalanceForEmployee(ctx, employee.id, year, clientTimeZone);

  return { balances };
}

/**
 * Get my days balance by year for a specific reason (UC-DAYS-02)
 */
export async function getMyDaysBalanceByYearAction(
  organisationAlias: string,
  unavailabilityReasonId: string,
  years?: number[]
): Promise<{
  balances: Array<{
    year: number;
    breakdown: {
      allocated: number;
      used: number;
      pending: number;
      remaining: number;
      balance: number;
      totalAvailable: number;
    };
  }>;
}> {
  const ctx = await resolveTenantContext(organisationAlias);

  // Get employee for current user
  const employee = await getEmployeeForUser(ctx);

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  const clientTimeZone = "Europe/Zagreb"; // TODO: get from user preferences or browser

  // Default to last 5 years if not specified
  const now = new Date();
  const currentYear = toZonedTime(now, clientTimeZone).getFullYear();
  const yearList = years ?? [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

  const balances = await getDaysBalanceByYear(ctx, employee.id, unavailabilityReasonId, yearList, clientTimeZone);

  return { balances };
}

/**
 * Get employee days balance (UC-DAYS-03)
 * Manager can view employees in their scope
 */
export async function getEmployeeDaysBalanceAction(
  organisationAlias: string,
  currentYear?: number,
  departmentIds?: string[]
): Promise<{
  employees: Array<{
    employeeId: string;
    employeeFirstName: string;
    employeeLastName: string;
    employeeEmail: string;
    departmentId: string;
    departmentName: string;
    balances: Array<{
      unavailabilityReasonId: string;
      unavailabilityReasonName: string;
      unavailabilityReasonColorCode: string | null;
      openYear: number | null;
      openYearBalance: number | null;
      breakdown: {
        allocated: number;
        used: number;
        pending: number;
        remaining: number;
        balance: number;
        totalAvailable: number;
      };
    }>;
  }>;
}> {
  const ctx = await resolveTenantContext(organisationAlias);

  // Check manager status
  //const managerStatus = await getManagerStatus(ctx);
  const userIsAdmin = isAdmin(ctx);

  if (!userIsAdmin) {
    throw new ForbiddenError("Nemate pristup ovoj funkcionalnosti");
  }

  const clientTimeZone = "Europe/Zagreb"; // TODO: get from user preferences or browser
  const now = new Date();
  const defaultYear = toZonedTime(now, clientTimeZone).getFullYear();
  const year = currentYear ?? defaultYear;

  // Get employees in manager scope
  let employeeIds: string[];

  if (userIsAdmin) {
    // GM: all employees in organisation
    const allEmployees = await db.employee.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
        ...(departmentIds && departmentIds.length > 0
          ? { departmentId: { in: departmentIds } }
          : {}),
      },
      select: {
        id: true,
      },
    });
    employeeIds = allEmployees.map((e) => e.id);
  } else {
    // // DM: only employees in managed departments
    // // Apply department filter if provided
    // let deptFilter = managerStatus.managedDepartmentIds;
    // if (departmentIds && departmentIds.length > 0) {
    //   // Filter to only include departments that DM manages
    //   deptFilter = departmentIds.filter((id) =>
    //     managerStatus.managedDepartmentIds.includes(id)
    //   );
    // }
    
    // const employees = await db.employee.findMany({
    //   where: {
    //     organisationId: ctx.organisationId,
    //     departmentId: { in: deptFilter },
    //     active: true,
    //   },
    //   select: {
    //     id: true,
    //   },
    // });
    // employeeIds = employees.map((e) => e.id);
    throw new ForbiddenError("Nemate pristup ovoj funkcionalnosti");
  }

  if (employeeIds.length === 0) {
    return { employees: [] };
  }

  const employees = await getDaysBalanceForManager(ctx, employeeIds, year, clientTimeZone);

  return { employees };
}

/**
 * Allocate days action (UC-DAYS-04)
 */
export async function allocateDaysAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Check manager status
    //const managerStatus = await getManagerStatus(ctx);
    const userIsAdmin = isAdmin(ctx);

    if (!userIsAdmin) {
      throw new ForbiddenError("Nemate pristup ovoj funkcionalnosti");
    }

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = allocateDaysSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        fieldErrors,
      };
    }

    const data = result.data;

    // Validate employee is in manager scope
    const employee = await db.employee.findFirst({
      where: {
        id: data.employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      throw new ForbiddenError("Zaposlenik nije pronađen");
    }

    // if (managerStatus.isGeneralManager) {
    //   // GM can access all employees
    // } else {
    //   // DM can only access employees in managed departments
    //   if (!managerStatus.managedDepartmentIds.includes(employee.departmentId)) {
    //     throw new ForbiddenError("Nemate pristup ovom zaposleniku");
    //   }
    // }

    // Get client timezone (default to Europe/Zagreb if not provided)
    const clientTimeZone = data.clientTimeZone || "Europe/Zagreb";

    // Call service with clientTimeZone
    await allocateDays(ctx, {
      ...data,
      clientTimeZone,
    });

    revalidatePath(`/${organisationAlias}/administration/days-balance`, "layout");

    return successState("Dodjela dana je uspješno kreirana");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Update allocation action (UC-DAYS-05)
 */
export async function updateAllocationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Check manager status
    const managerStatus = await getManagerStatus(ctx);

    if (!managerStatus.isGeneralManager && !managerStatus.isDepartmentManager) {
      throw new ForbiddenError("Nemate pristup ovoj funkcionalnosti");
    }

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = updateAllocationSchema.safeParse(rawData);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        fieldErrors,
      };
    }

    const data = result.data;

    // Validate employee is in manager scope
    const employee = await db.employee.findFirst({
      where: {
        id: data.employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      throw new ForbiddenError("Zaposlenik nije pronađen");
    }
/*
    if (managerStatus.isGeneralManager) {
      // GM can access all employees
    } else {
      // DM can only access employees in managed departments
      if (!managerStatus.managedDepartmentIds.includes(employee.departmentId)) {
        throw new ForbiddenError("Nemate pristup ovom zaposleniku");
      }
    }*/

    // Get client timezone (default to Europe/Zagreb if not provided)
    const clientTimeZone = data.clientTimeZone || "Europe/Zagreb";

    // Call service with clientTimeZone
    await updateAllocation(ctx, {
      ...data,
      clientTimeZone,
    });

    revalidatePath(`/${organisationAlias}/administration/days-balance`, "layout");

    return successState("Dodjela dana je uspješno ažurirana");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Get ledger history action (UC-DAYS-06)
 */
export async function getLedgerHistoryAction(
  organisationAlias: string,
  employeeId: string,
  unavailabilityReasonId: string,
  year?: number
): Promise<{
  entries: Array<{
    id: string;
    year: number;
    type: string;
    typeLabel: string;
    changeDays: number;
    note: string | null;
    applicationId: string | null;
    createdAt: Date;
    createdBy: {
      firstName: string;
      lastName: string;
    } | null;
  }>;
}> {
  const ctx = await resolveTenantContext(organisationAlias);

  // Check manager status
  const managerStatus = await getManagerStatus(ctx);
  const userIsAdmin = isAdmin(ctx);

  if (!userIsAdmin) {
    throw new ForbiddenError("Nemate pristup ovoj funkcionalnosti");
  }

  // Validate employee is in manager scope
  const employee = await db.employee.findFirst({
    where: {
      id: employeeId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Zaposlenik nije pronađen");
  }

  // if (managerStatus.isGeneralManager) {
  //   // GM can access all employees
  // } else {
  //   // DM can only access employees in managed departments
  //   if (!managerStatus.managedDepartmentIds.includes(employee.departmentId)) {
  //     throw new ForbiddenError("Nemate pristup ovom zaposleniku");
  //   }
  // }

  const entries = await getLedgerHistory(ctx, employeeId, unavailabilityReasonId, year);

  return { entries };
}

