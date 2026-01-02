"use server";

import { revalidatePath } from "next/cache";
import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import {
  applicationDecisionSchema,
  saveDraftApplicationSchema,
  submitApplicationSchema,
  deleteApplicationSchema,
  validateApplicationDraftSchema,
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
  saveDraftApplication,
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
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = applicationDecisionSchema.safeParse(rawData);

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

    // Call service
    await decideAsDepartmentManager(ctx, data);

    revalidatePath(`/${organisationAlias}`);
    
    const message = data.decision === "APPROVE" 
      ? "Zahtjev je uspješno odobren"
      : "Zahtjev je uspješno odbijen";
    
    return successState(message);
  } catch (error) {
    return mapErrorToFormState(error);
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
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = applicationDecisionSchema.safeParse(rawData);

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

    // Call service
    await decideAsGeneralManager(ctx, data);

    revalidatePath(`/${organisationAlias}`);
    
    const message = data.decision === "APPROVE" 
      ? "Zahtjev je uspješno finalno odobren"
      : "Zahtjev je uspješno odbijen";
    
    return successState(message);
  } catch (error) {
    return mapErrorToFormState(error);
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
 * Save draft application (UC-APP-02)
 */
export async function saveDraftApplicationAction(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = saveDraftApplicationSchema.safeParse(rawData);

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

    // Call service
    const saved = await saveDraftApplication(ctx, data);

    revalidatePath(`/${organisationAlias}/applications`);
    
    const message = data.applicationId 
      ? "Nacrt je uspješno ažuriran"
      : "Nacrt je uspješno spremljen";
    
    return {
      ...successState(message),
      data: { applicationId: saved.applicationId },
    };
  } catch (error) {
    return mapErrorToFormState(error);
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

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = submitApplicationSchema.safeParse(rawData);

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

    // Call service
    await submitApplication(ctx, data);

    revalidatePath(`/${organisationAlias}/applications`);
    revalidatePath(`/${organisationAlias}`);
    
    return successState("Zahtjev je uspješno poslan na odobrenje");
  } catch (error) {
    return mapErrorToFormState(error);
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

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = deleteApplicationSchema.safeParse(rawData);

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

    // Call service
    await deleteDraftApplication(ctx, data.applicationId);

    revalidatePath(`/${organisationAlias}/applications`);
    
    return successState("Zahtjev je uspješno obrisan");
  } catch (error) {
    return mapErrorToFormState(error);
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

