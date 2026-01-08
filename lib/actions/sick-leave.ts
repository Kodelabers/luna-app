"use server";

import { revalidatePath } from "next/cache";
import { resolveTenantContext, requireManagerAccess } from "@/lib/tenant/resolveTenantContext";
import {
  openSickLeaveSchema,
  closeSickLeaveSchema,
  cancelSickLeaveSchema,
} from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
} from "@/lib/errors";
import {
  openSickLeave,
  closeSickLeave,
  cancelSickLeave,
} from "@/lib/services/sick-leave";
import { db } from "@/lib/db";

/**
 * Open sick leave action (UC-SL-01)
 */
export async function openSickLeaveAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = openSickLeaveSchema.safeParse(rawData);

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

    // Get employee to check department
    const employee = await db.employee.findFirst({
      where: {
        id: data.employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!employee) {
      return {
        success: false,
        formError: "Zaposlenik nije pronađen",
      };
    }

    // Check manager access
    await requireManagerAccess(ctx, employee.departmentId);

    // Call service
    await openSickLeave(ctx, data);

    // Revalidate relevant paths
    revalidatePath(`/${organisationAlias}/department/${employee.departmentId}/sick-leaves`);
    revalidatePath(`/${organisationAlias}/sick-leaves`);
    revalidatePath(`/${organisationAlias}/planning`);
    revalidatePath(`/${organisationAlias}`);

    return successState("Bolovanje je uspješno otvoreno");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Close sick leave action (UC-SL-02)
 */
export async function closeSickLeaveAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = closeSickLeaveSchema.safeParse(rawData);

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

    // Get sick leave to check department
    const sickLeave = await db.sickLeave.findFirst({
      where: {
        id: data.sickLeaveId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!sickLeave) {
      return {
        success: false,
        formError: "Bolovanje nije pronađeno",
      };
    }

    // Check manager access
    await requireManagerAccess(ctx, sickLeave.departmentId);

    // Call service
    await closeSickLeave(ctx, data);

    // Revalidate relevant paths
    revalidatePath(`/${organisationAlias}/department/${sickLeave.departmentId}/sick-leaves`);
    revalidatePath(`/${organisationAlias}/sick-leaves`);
    revalidatePath(`/${organisationAlias}/planning`);
    revalidatePath(`/${organisationAlias}`);

    return successState("Bolovanje je uspješno zatvoreno");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

/**
 * Cancel sick leave action (UC-SL-03)
 */
export async function cancelSickLeaveAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = cancelSickLeaveSchema.safeParse(rawData);

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

    // Get sick leave to check department
    const sickLeave = await db.sickLeave.findFirst({
      where: {
        id: data.sickLeaveId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!sickLeave) {
      return {
        success: false,
        formError: "Bolovanje nije pronađeno",
      };
    }

    // Check manager access
    await requireManagerAccess(ctx, sickLeave.departmentId);

    // Call service
    await cancelSickLeave(ctx, data);

    // Revalidate relevant paths
    revalidatePath(`/${organisationAlias}/department/${sickLeave.departmentId}/sick-leaves`);
    revalidatePath(`/${organisationAlias}/sick-leaves`);
    revalidatePath(`/${organisationAlias}/planning`);
    revalidatePath(`/${organisationAlias}`);

    return successState("Bolovanje je uspješno poništeno");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

