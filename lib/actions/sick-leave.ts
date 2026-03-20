"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
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
  hasRemainingDaysAfterEndDate,
} from "@/lib/services/sick-leave";
import { db } from "@/lib/db";
import { parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

/**
 * Open sick leave action (UC-SL-01)
 */
export async function openSickLeaveAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("sickLeave");
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
        formError: t("errors.employeeNotFound"),
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

    return successState(t("messages.opened"));
  } catch (error) {
    return await mapErrorToFormState(error);
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
    const t = await getTranslations("sickLeave");
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
        formError: t("errors.notFound"),
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

    return successState(t("messages.closed"));
  } catch (error) {
    return await mapErrorToFormState(error);
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
    const t = await getTranslations("sickLeave");
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
        formError: t("errors.notFound"),
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

    return successState(t("messages.cancelled"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Check if there are remaining days after end date for a sick leave
 * Used by UI to determine if option to cancel remaining days should be shown
 */
export async function checkRemainingDaysAction(
  organisationAlias: string,
  sickLeaveId: string,
  endDateLocalISO: string,
  clientTimeZone: string
): Promise<{ hasRemainingDays: boolean }> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Get sick leave
    const sickLeave = await db.sickLeave.findFirst({
      where: {
        id: sickLeaveId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!sickLeave) {
      return { hasRemainingDays: false };
    }

    // Check manager access
    await requireManagerAccess(ctx, sickLeave.departmentId);

    // Parse end date and convert to UTC
    const endDateLocal = parseISO(endDateLocalISO);
    const endDateUTC = fromZonedTime(endDateLocal, clientTimeZone);

    // Check for remaining days
    const hasRemainingDays = await hasRemainingDaysAfterEndDate(
      ctx,
      sickLeave.employeeId,
      endDateUTC,
      clientTimeZone
    );

    return { hasRemainingDays };
  } catch (error) {
    // On error, return false to not show the option
    return { hasRemainingDays: false };
  }
}

