"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import {
  applicationDecisionSchema,
  createApplicationSchema,
  submitApplicationSchema,
  deleteApplicationSchema,
} from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
} from "@/lib/errors";
import {
  decideAsDepartmentManager,
  decideAsGeneralManager,
  validateApplicationDraft,
  createApplication,
  submitApplication,
  deleteDraftApplication,
  listMyApplications,
  listDepartmentApplications,
} from "@/lib/services/application";
import { requireDepartmentAccess } from "@/lib/tenant/resolveTenantContext";

/**
 * DM decides on application (UC-DASH-04)
 */
export async function dmDecideApplicationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("applications");
    const tVal = await getTranslations("validation");
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = applicationDecisionSchema(tVal).safeParse(rawData);

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

    // Call service (include requestedStartDate/requestedEndDate for date correction on approve)
    await decideAsDepartmentManager(ctx, {
      applicationId: data.applicationId,
      decision: data.decision,
      comment: data.comment,
      clientTimeZone: data.clientTimeZone,
      requestedStartDate: data.requestedStartDate,
      requestedEndDate: data.requestedEndDate,
    });

    revalidatePath(`/${organisationAlias}`);

    const message = data.decision === "APPROVE"
      ? t("messages.approved")
      : t("messages.rejected");

    return successState(message);
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * GM decides on application (UC-DASH-05)
 */
export async function gmDecideApplicationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const t = await getTranslations("applications");
    const tVal = await getTranslations("validation");
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = applicationDecisionSchema(tVal).safeParse(rawData);

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

    // Call service (include requestedStartDate/requestedEndDate for date correction on approve)
    await decideAsGeneralManager(ctx, {
      applicationId: data.applicationId,
      decision: data.decision,
      comment: data.comment,
      clientTimeZone: data.clientTimeZone,
      requestedStartDate: data.requestedStartDate,
      requestedEndDate: data.requestedEndDate,
    });

    revalidatePath(`/${organisationAlias}`);

    const message = data.decision === "APPROVE"
      ? t("messages.finallyApproved")
      : t("messages.rejected");

    return successState(message);
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Validate application draft (UC-APP-01)
 */
export async function validateApplicationDraftAction(
  organisationAlias: string,
  input: {
    unavailabilityReasonId: string;
    startDateLocalISO: string;
    endDateLocalISO: string;
    clientTimeZone: string;
    editingApplicationId?: string;
    employeeId?: string;
  }
) {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    const result = await validateApplicationDraft(ctx, input);
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Create application (UC-APP-02)
 * When a manager creates for another employee, it goes directly to SUBMITTED.
 */
export async function createApplicationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    const tVal = await getTranslations("validation");

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = createApplicationSchema(tVal).safeParse(rawData);

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

    const t = await getTranslations("applications");

    // Call service
    const saved = await createApplication(ctx, data);

    revalidatePath(`/${organisationAlias}/applications`);
    revalidatePath(`/${organisationAlias}`);

    // Determine message based on status
    let message: string;
    if (data.applicationId) {
      message = t("messages.draftUpdated");
    } else if (saved.status === "SUBMITTED") {
      message = t("messages.submitted");
    } else {
      message = t("messages.draftSaved");
    }

    return {
      ...successState(message),
      data: { applicationId: saved.applicationId },
    };
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Submit application (UC-APP-03)
 */
export async function submitApplicationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    const tVal = await getTranslations("validation");

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = submitApplicationSchema(tVal).safeParse(rawData);

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

    const t = await getTranslations("applications");

    // Call service
    await submitApplication(ctx, data);

    revalidatePath(`/${organisationAlias}/applications`);
    revalidatePath(`/${organisationAlias}`);

    return successState(t("messages.submitted"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Delete draft application (UC-APP-04)
 */
export async function deleteDraftApplicationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    const tVal = await getTranslations("validation");

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = deleteApplicationSchema(tVal).safeParse(rawData);

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

    const t = await getTranslations("applications");

    // Call service
    await deleteDraftApplication(ctx, data.applicationId);

    revalidatePath(`/${organisationAlias}/applications`);

    return successState(t("messages.deleted"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * List my applications (UC-APP-05)
 */
export async function listMyApplicationsAction(
  organisationAlias: string,
  filters?: {
    status?: string;
    year?: number;
    reasonId?: string;
    clientTimeZone?: string;
  }
) {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Convert status string to ApplicationStatus if provided
    const parsedFilters = filters ? {
      ...filters,
      status: filters.status as any,
      clientTimeZone: filters.clientTimeZone,
    } : undefined;

    const applications = await listMyApplications(ctx, parsedFilters);
    return applications;
  } catch (error) {
    throw error;
  }
}

/**
 * List department applications (for DM/GM view)
 */
export async function listDepartmentApplicationsAction(
  organisationAlias: string,
  departmentId: string,
  filters?: {
    status?: string;
    reasonId?: string;
    clientTimeZone?: string;
  }
) {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Check department access (DM or GM)
    await requireDepartmentAccess(ctx, departmentId);

    // Convert status string to ApplicationStatus if provided
    const parsedFilters = filters ? {
      ...filters,
      status: filters.status as any,
      clientTimeZone: filters.clientTimeZone,
    } : undefined;

    const applications = await listDepartmentApplications(ctx, departmentId, parsedFilters);
    return applications;
  } catch (error) {
    throw error;
  }
}
