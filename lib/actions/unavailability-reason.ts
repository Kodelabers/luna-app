"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import {
  createUnavailabilityReasonSchema,
} from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
  ConflictError,
  NotFoundError,
} from "@/lib/errors";

/**
 * Create a new unavailability reason
 */
export async function createUnavailabilityReason(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("unavailabilityReasons");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Parse and validate form data
    const rawData: Record<string, unknown> = Object.fromEntries(formData.entries());

    // Explicitly parse boolean values from FormData strings
    // FormData returns strings, so "true"/"false" need to be converted to booleans
    if (rawData.needApproval !== undefined) {
      rawData.needApproval = rawData.needApproval === "true" || rawData.needApproval === true;
    } else {
      rawData.needApproval = false;
    }
    if (rawData.needSecondApproval !== undefined) {
      rawData.needSecondApproval = rawData.needSecondApproval === "true" || rawData.needSecondApproval === true;
    } else {
      rawData.needSecondApproval = false;
    }
    if (rawData.hasPlanning !== undefined) {
      rawData.hasPlanning = rawData.hasPlanning === "true" || rawData.hasPlanning === true;
    } else {
      rawData.hasPlanning = false;
    }
    if (rawData.sickLeave !== undefined) {
      rawData.sickLeave = rawData.sickLeave === "true" || rawData.sickLeave === true;
    } else {
      rawData.sickLeave = false;
    }

    const tVal = await getTranslations("validation");
    const result = createUnavailabilityReasonSchema(tVal).safeParse(rawData);

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

    // Check for duplicate name within organisation
    const existing = await db.unavailabilityReason.findFirst({
      where: {
        organisationId: ctx.organisationId,
        name: data.name,
        active: true,
      },
    });

    if (existing) {
      throw new ConflictError(t("messages.nameExists"));
    }

    // Create unavailability reason
    await db.unavailabilityReason.create({
      data: {
        organisationId: ctx.organisationId,
        name: data.name,
        colorCode: data.colorCode || null,
        needApproval: data.needApproval ?? false,
        needSecondApproval: data.needSecondApproval ?? false,
        hasPlanning: data.hasPlanning ?? false,
        sickLeave: data.sickLeave ?? false,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/unavailability-reasons`);
    return successState(t("messages.created"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Update an existing unavailability reason
 */
export async function updateUnavailabilityReason(
  organisationAlias: string,
  reasonId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("unavailabilityReasons");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Check reason exists and belongs to organisation
    const reason = await db.unavailabilityReason.findFirst({
      where: {
        id: reasonId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!reason) {
      throw new NotFoundError(t("messages.notFound"));
    }

    // Parse and validate form data
    const rawData: Record<string, unknown> = Object.fromEntries(formData.entries());

    // Explicitly parse boolean values from FormData strings
    // FormData returns strings, so "true"/"false" need to be converted to booleans
    if (rawData.needApproval !== undefined) {
      rawData.needApproval = rawData.needApproval === "true" || rawData.needApproval === true;
    } else {
      rawData.needApproval = false;
    }
    if (rawData.needSecondApproval !== undefined) {
      rawData.needSecondApproval = rawData.needSecondApproval === "true" || rawData.needSecondApproval === true;
    } else {
      rawData.needSecondApproval = false;
    }
    if (rawData.hasPlanning !== undefined) {
      rawData.hasPlanning = rawData.hasPlanning === "true" || rawData.hasPlanning === true;
    } else {
      rawData.hasPlanning = false;
    }
    if (rawData.sickLeave !== undefined) {
      rawData.sickLeave = rawData.sickLeave === "true" || rawData.sickLeave === true;
    } else {
      rawData.sickLeave = false;
    }

    const tVal = await getTranslations("validation");
    const result = createUnavailabilityReasonSchema(tVal).safeParse(rawData);

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

    // Check for duplicate name (excluding current reason)
    const existing = await db.unavailabilityReason.findFirst({
      where: {
        organisationId: ctx.organisationId,
        name: data.name,
        active: true,
        NOT: { id: reasonId },
      },
    });

    if (existing) {
      throw new ConflictError(t("messages.nameExists"));
    }

    // Update unavailability reason
    await db.unavailabilityReason.update({
      where: { id: reasonId },
      data: {
        name: data.name,
        colorCode: data.colorCode || null,
        needApproval: data.needApproval ?? false,
        needSecondApproval: data.needSecondApproval ?? false,
        hasPlanning: data.hasPlanning ?? false,
        sickLeave: data.sickLeave ?? false,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/unavailability-reasons`);
    return successState(t("messages.updated"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Delete (soft delete) an unavailability reason
 */
export async function deleteUnavailabilityReason(
  organisationAlias: string,
  reasonId: string
): Promise<FormState> {
  try {
    const t = await getTranslations("unavailabilityReasons");
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Check reason exists and belongs to organisation
    const reason = await db.unavailabilityReason.findFirst({
      where: {
        id: reasonId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!reason) {
      throw new NotFoundError(t("messages.notFound"));
    }

    // Soft delete
    await db.unavailabilityReason.update({
      where: { id: reasonId },
      data: { active: false },
    });

    revalidatePath(`/${organisationAlias}/administration/unavailability-reasons`);
    return successState(t("messages.deleted"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

