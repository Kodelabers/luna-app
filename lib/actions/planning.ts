"use server";

import { resolveTenantContext } from "@/lib/tenant/resolveTenantContext";
import { getPlanningDataSchema } from "@/lib/validation/schemas";
import { mapErrorToFormState } from "@/lib/errors";
import { getPlanningData, type PlanningData } from "@/lib/services/planning";

/**
 * Get planning data for DM/GM (UC-PLAN-01)
 * Returns serializable PlanningData model
 */
export async function getPlanningDataAction(
  organisationAlias: string,
  fromLocalISO: string,
  toLocalISO: string,
  clientTimeZone: string,
  departmentId?: number
): Promise<{ success: true; data: PlanningData } | { success: false; formError: string; fieldErrors?: Record<string, string[]> }> {
  try {
    // 1. Resolve tenant context
    const ctx = await resolveTenantContext(organisationAlias);

    // 2. Validate input
    const validationResult = getPlanningDataSchema.safeParse({
      fromLocalISO,
      toLocalISO,
      clientTimeZone,
      departmentId,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validationResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        formError: "Neispravni podaci za dohvat planiranja",
        fieldErrors,
      };
    }

    // 3. Call service
    const data = await getPlanningData(ctx, validationResult.data);

    // 4. Return serializable data
    return {
      success: true,
      data,
    };
  } catch (error) {
    const formState = mapErrorToFormState(error);
    return {
      success: false,
      formError: formState.formError ?? "Došlo je do greške pri dohvaćanju podataka",
      fieldErrors: formState.fieldErrors,
    };
  }
}

