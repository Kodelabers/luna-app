"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import { createEmployeeSchema } from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";
import { getDaysBalanceForEmployee, type EmployeeDaysBalance } from "@/lib/services/days-balance";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { ApplicationStatus } from "@prisma/client";

/**
 * Create a new employee
 */
export async function createEmployee(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const tVal = await getTranslations("validation");
    const result = createEmployeeSchema(tVal).safeParse(rawData);

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

    const tErr = await getTranslations("errors");
    const tEmp = await getTranslations("employees");
    const tMsg = await getTranslations("messages");
    const data = result.data;

    // Check if department belongs to organisation
    const department = await db.department.findFirst({
      where: {
        id: data.departmentId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!department) {
      throw new NotFoundError(tMsg("departmentNotFound"));
    }

    // Check for duplicate email within organisation
    const existing = await db.employee.findFirst({
      where: {
        organisationId: ctx.organisationId,
        email: data.email,
        active: true,
      },
    });

    if (existing) {
      throw new ConflictError(tEmp("messages.emailExists"));
    }

    // Handle userId
    const userId = formData.get("userId");
    const parsedUserId = userId ? (userId as string) : null;

    // If userId provided, verify it exists
    if (parsedUserId) {
      const user = await db.user.findFirst({
        where: {
          id: parsedUserId,
          active: true,
        },
      });

      if (!user) {
        throw new NotFoundError(tErr("userNotFound"));
      }
    }

    // Create employee
    await db.employee.create({
      data: {
        organisationId: ctx.organisationId,
        departmentId: data.departmentId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        title: data.title || null,
        userId: parsedUserId,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState(tEmp("messages.created"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  organisationAlias: string,
  employeeId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    const tErr = await getTranslations("errors");
    const tEmp = await getTranslations("employees");
    const tMsg = await getTranslations("messages");
    const tVal = await getTranslations("validation");

    // Check employee exists and belongs to organisation
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

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = createEmployeeSchema(tVal).safeParse(rawData);

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

    // Check if department belongs to organisation
    const department = await db.department.findFirst({
      where: {
        id: data.departmentId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!department) {
      throw new NotFoundError(tMsg("departmentNotFound"));
    }

    // Check for duplicate email (excluding current employee)
    const existing = await db.employee.findFirst({
      where: {
        organisationId: ctx.organisationId,
        email: data.email,
        active: true,
        NOT: { id: employeeId },
      },
    });

    if (existing) {
      throw new ConflictError(tEmp("messages.emailExists"));
    }

    // Handle userId
    const userId = formData.get("userId");
    const parsedUserId = userId ? (userId as string) : null;

    // If userId provided, verify it exists
    if (parsedUserId) {
      const user = await db.user.findFirst({
        where: {
          id: parsedUserId,
          active: true,
        },
      });

      if (!user) {
        throw new NotFoundError(tErr("userNotFound"));
      }
    }

    // Update employee
    await db.employee.update({
      where: { id: employeeId },
      data: {
        departmentId: data.departmentId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        title: data.title || null,
        userId: parsedUserId,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState(tEmp("messages.updated"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Delete (soft delete) an employee
 */
export async function deleteEmployee(
  organisationAlias: string,
  employeeId: string
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    const tErr = await getTranslations("errors");
    const tEmp = await getTranslations("employees");

    // Check employee exists and belongs to organisation
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

    // Soft delete
    await db.employee.update({
      where: { id: employeeId },
      data: { active: false },
    });

    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState(tEmp("messages.deleted"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Search users for linking to employee
 * Returns max 10 results for performance
 */
export async function searchUsers(
  organisationAlias: string,
  query: string
): Promise<{ id: string; firstName: string; lastName: string; email: string }[]> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    if (!query || query.length < 2) {
      return [];
    }

    // Search users by firstName, lastName
    const queryParts = query.trim().split(/\s+/);
    const users = await db.user.findMany({
      where: {
        active: true,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          ...(queryParts.length >= 2
            ? [
                {
                  AND: [
                    { firstName: { contains: queryParts.slice(0, -1).join(" "), mode: "insensitive" as const } },
                    { lastName: { contains: queryParts[queryParts.length - 1], mode: "insensitive" as const } },
                  ],
                },
                {
                  AND: [
                    { firstName: { contains: queryParts[0], mode: "insensitive" as const } },
                    { lastName: { contains: queryParts.slice(1).join(" "), mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: 10,
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

/**
 * Get user by ID (for displaying linked user in form)
 */
export async function getUserById(
  organisationAlias: string,
  userId: string
): Promise<{ id: string; firstName: string; lastName: string; email: string } | null> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    const user = await db.user.findFirst({
      where: {
        id: userId,
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/**
 * Employee profile data type
 */
export type EmployeeProfileData = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string | null;
    department: {
      id: string;
      name: string;
      colorCode: string | null;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  };
  daysBalance: EmployeeDaysBalance[];
  openApplications: Array<{
    id: string;
    status: ApplicationStatus;
    unavailabilityReasonName: string;
    unavailabilityReasonColor: string | null;
    startDateLocalISO: string;
    endDateLocalISO: string;
  }>;
  sickLeaveBalances: Array<{
    unavailabilityReasonId: string;
    unavailabilityReasonName: string;
    unavailabilityReasonColorCode: string | null;
    days: number;
  }>;
};

/**
 * Get employee profile data for dialog
 * Returns employee details, days balance, and open applications
 */
export async function getEmployeeProfileAction(
  organisationAlias: string,
  employeeId: string,
  clientTimeZone: string
): Promise<
  | { success: true; data: EmployeeProfileData }
  | { success: false; error: string }
> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Fetch employee with department and user
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            colorCode: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      const tErr = await getTranslations("errors");
      return { success: false, error: tErr("employeeNotFound") };
    }

    // Get current year in client timezone
    const now = new Date();
    const currentYear = toZonedTime(now, clientTimeZone).getFullYear();
    const yearStart = fromZonedTime(new Date(currentYear, 0, 1, 0, 0, 0, 0), clientTimeZone);
    const yearEnd = fromZonedTime(new Date(currentYear, 11, 31, 23, 59, 59, 999), clientTimeZone);

    // Get days balance for employee
    const daysBalance = await getDaysBalanceForEmployee(
      ctx,
      employeeId,
      currentYear,
      clientTimeZone
    );

    // Get open applications (SUBMITTED, APPROVED_FIRST_LEVEL)
    const applications = await db.application.findMany({
      where: {
        organisationId: ctx.organisationId,
        employeeId,
        active: true,
        status: {
          in: ["SUBMITTED", "APPROVED_FIRST_LEVEL"],
        },
      },
      include: {
        unavailabilityReason: {
          select: {
            name: true,
            colorCode: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // Format applications with local dates
    const openApplications = applications.map((app) => {
      const startLocal = toZonedTime(app.startDate, clientTimeZone);
      const endLocal = toZonedTime(app.endDate, clientTimeZone);

      return {
        id: app.id,
        status: app.status,
        unavailabilityReasonName: app.unavailabilityReason.name,
        unavailabilityReasonColor: app.unavailabilityReason.colorCode,
        startDateLocalISO: startLocal.toISOString().split("T")[0],
        endDateLocalISO: endLocal.toISOString().split("T")[0],
      };
    });

    // Get all active sick leave reasons for the organisation
    const sickLeaveReasons = await db.unavailabilityReason.findMany({
      where: {
        organisationId: ctx.organisationId,
        sickLeave: true,
        active: true,
      },
      select: { id: true, name: true, colorCode: true },
      orderBy: { name: "asc" },
    });

    // Get sick leave days for current year (CLOSED sick leaves only)
    const closedSickLeaves = await db.sickLeave.findMany({
      where: {
        organisationId: ctx.organisationId,
        employeeId,
        status: "CLOSED",
        active: true,
        startDate: { lte: yearEnd },
        endDate: { gte: yearStart },
      },
      select: {
        unavailabilityReasonId: true,
        _count: {
          select: {
            daySchedules: {
              where: { active: true, date: { gte: yearStart, lte: yearEnd } },
            },
          },
        },
      },
    });

    const sickLeaveCountMap = new Map<string, number>();
    for (const sl of closedSickLeaves) {
      const current = sickLeaveCountMap.get(sl.unavailabilityReasonId) ?? 0;
      sickLeaveCountMap.set(sl.unavailabilityReasonId, current + sl._count.daySchedules);
    }

    const sickLeaveBalances = sickLeaveReasons
      .map((reason) => ({
        unavailabilityReasonId: reason.id,
        unavailabilityReasonName: reason.name,
        unavailabilityReasonColorCode: reason.colorCode,
        days: sickLeaveCountMap.get(reason.id) ?? 0,
      }))
      .filter((sl) => sl.days > 0);

    return {
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          title: employee.title,
          department: employee.department,
          user: employee.user,
        },
        daysBalance,
        openApplications,
        sickLeaveBalances,
      },
    };
  } catch (error) {
    console.error("Error getting employee profile:", error);
    const tEmp = await getTranslations("employees");
    return { success: false, error: tEmp("messages.profileError") };
  }
}
