"use server";

import { revalidatePath } from "next/cache";
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
    requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = createEmployeeSchema.safeParse(rawData);

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
      throw new NotFoundError("Odjel nije pronađen");
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
      throw new ConflictError("Zaposlenik s ovim emailom već postoji");
    }

    // Handle userId
    const userId = formData.get("userId");
    const parsedUserId = userId ? parseInt(userId as string, 10) : null;

    // If userId provided, verify it exists
    if (parsedUserId) {
      const user = await db.user.findFirst({
        where: {
          id: parsedUserId,
          active: true,
        },
      });

      if (!user) {
        throw new NotFoundError("Korisnik nije pronađen");
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
    return successState("Zaposlenik je uspješno kreiran");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  organisationAlias: string,
  employeeId: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    // Check employee exists and belongs to organisation
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      throw new NotFoundError("Zaposlenik nije pronađen");
    }

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = createEmployeeSchema.safeParse(rawData);

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
      throw new NotFoundError("Odjel nije pronađen");
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
      throw new ConflictError("Zaposlenik s ovim emailom već postoji");
    }

    // Handle userId
    const userId = formData.get("userId");
    const parsedUserId = userId ? parseInt(userId as string, 10) : null;

    // If userId provided, verify it exists
    if (parsedUserId) {
      const user = await db.user.findFirst({
        where: {
          id: parsedUserId,
          active: true,
        },
      });

      if (!user) {
        throw new NotFoundError("Korisnik nije pronađen");
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
    return successState("Zaposlenik je uspješno ažuriran");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Delete (soft delete) an employee
 */
export async function deleteEmployee(
  organisationAlias: string,
  employeeId: number
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    // Check employee exists and belongs to organisation
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      throw new NotFoundError("Zaposlenik nije pronađen");
    }

    // Soft delete
    await db.employee.update({
      where: { id: employeeId },
      data: { active: false },
    });

    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState("Zaposlenik je uspješno obrisan");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Search users for linking to employee
 * Returns max 10 results for performance
 */
export async function searchUsers(
  organisationAlias: string,
  query: string
): Promise<{ id: number; firstName: string; lastName: string; email: string }[]> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    if (!query || query.length < 2) {
      return [];
    }

    // Search users by firstName, lastName
    const users = await db.user.findMany({
      where: {
        active: true,
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
  userId: number
): Promise<{ id: number; firstName: string; lastName: string; email: string } | null> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

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

