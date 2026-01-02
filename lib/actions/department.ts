"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";

/**
 * Create a new department
 */
export async function createDepartment(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = createDepartmentSchema.safeParse(rawData);

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

    // Check for duplicate alias within organisation
    const existing = await db.department.findFirst({
      where: {
        organisationId: ctx.organisationId,
        alias: data.alias,
      },
    });

    if (existing) {
      throw new ConflictError("Odjel s ovim aliasom već postoji");
    }

    // Create department
    await db.department.create({
      data: {
        organisationId: ctx.organisationId,
        name: data.name,
        alias: data.alias,
        description: data.description || null,
        colorCode: data.colorCode || null,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/departments`);
    return successState("Odjel je uspješno kreiran");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Update an existing department
 */
export async function updateDepartment(
  organisationAlias: string,
  departmentId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    // Check department exists and belongs to organisation
    const department = await db.department.findFirst({
      where: {
        id: departmentId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!department) {
      throw new NotFoundError("Odjel nije pronađen");
    }

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = createDepartmentSchema.safeParse(rawData);

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

    // Check for duplicate alias (excluding current department)
    const existing = await db.department.findFirst({
      where: {
        organisationId: ctx.organisationId,
        alias: data.alias,
        NOT: { id: departmentId },
      },
    });

    if (existing) {
      throw new ConflictError("Odjel s ovim aliasom već postoji");
    }

    // Update department
    await db.department.update({
      where: { id: departmentId },
      data: {
        name: data.name,
        alias: data.alias,
        description: data.description || null,
        colorCode: data.colorCode || null,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/departments`);
    return successState("Odjel je uspješno ažuriran");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Delete (soft delete) a department
 */
export async function deleteDepartment(
  organisationAlias: string,
  departmentId: string
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    requireAdmin(ctx);

    // Check department exists and belongs to organisation
    const department = await db.department.findFirst({
      where: {
        id: departmentId,
        organisationId: ctx.organisationId,
        active: true,
      },
      include: {
        _count: {
          select: {
            employees: { where: { active: true } },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError("Odjel nije pronađen");
    }

    // Check if department has active employees
    if (department._count.employees > 0) {
      throw new ConflictError(
        `Nije moguće obrisati odjel koji ima ${department._count.employees} aktivnih zaposlenika`
      );
    }

    // Soft delete
    await db.department.update({
      where: { id: departmentId },
      data: { active: false },
    });

    revalidatePath(`/${organisationAlias}/administration/departments`);
    return successState("Odjel je uspješno obrisan");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

