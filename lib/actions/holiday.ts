"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import { createHolidaySchema } from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";

/**
 * Create a new holiday
 */
export async function createHoliday(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("holidays");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Parse and validate form data
    const rawData: Record<string, unknown> = Object.fromEntries(formData.entries());

    // Explicitly parse boolean values from FormData strings
    if (rawData.repeatYearly !== undefined) {
      rawData.repeatYearly = rawData.repeatYearly === "true" || rawData.repeatYearly === true;
    } else {
      rawData.repeatYearly = false;
    }

    const result = createHolidaySchema.safeParse(rawData);

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

    // Check for duplicate name + date within organisation
    const existing = await db.holiday.findFirst({
      where: {
        organisationId: ctx.organisationId,
        name: data.name,
        date: data.date,
        active: true,
      },
    });

    if (existing) {
      throw new ConflictError(t("messages.duplicateExists"));
    }

    // Create holiday
    await db.holiday.create({
      data: {
        organisationId: ctx.organisationId,
        name: data.name,
        date: data.date,
        repeatYearly: data.repeatYearly ?? false,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/holidays`);
    return successState(t("messages.created"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Update an existing holiday
 */
export async function updateHoliday(
  organisationAlias: string,
  holidayId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("holidays");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Check holiday exists and belongs to organisation
    const holiday = await db.holiday.findFirst({
      where: {
        id: holidayId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!holiday) {
      throw new NotFoundError(t("messages.notFound"));
    }

    // Parse and validate form data
    const rawData: Record<string, unknown> = Object.fromEntries(formData.entries());

    // Explicitly parse boolean values from FormData strings
    if (rawData.repeatYearly !== undefined) {
      rawData.repeatYearly = rawData.repeatYearly === "true" || rawData.repeatYearly === true;
    } else {
      rawData.repeatYearly = false;
    }

    const result = createHolidaySchema.safeParse(rawData);

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

    // Check for duplicate name + date (excluding current holiday)
    const existing = await db.holiday.findFirst({
      where: {
        organisationId: ctx.organisationId,
        name: data.name,
        date: data.date,
        active: true,
        NOT: { id: holidayId },
      },
    });

    if (existing) {
      throw new ConflictError(t("messages.duplicateExists"));
    }

    // Update holiday
    await db.holiday.update({
      where: { id: holidayId },
      data: {
        name: data.name,
        date: data.date,
        repeatYearly: data.repeatYearly ?? false,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/holidays`);
    return successState(t("messages.updated"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Delete (soft delete) a holiday
 */
export async function deleteHoliday(
  organisationAlias: string,
  holidayId: string
): Promise<FormState> {
  try {
    const t = await getTranslations("holidays");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Check holiday exists and belongs to organisation
    const holiday = await db.holiday.findFirst({
      where: {
        id: holidayId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!holiday) {
      throw new NotFoundError(t("messages.notFound"));
    }

    // Soft delete
    await db.holiday.update({
      where: { id: holidayId },
      data: { active: false },
    });

    revalidatePath(`/${organisationAlias}/administration/holidays`);
    return successState(t("messages.deleted"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

