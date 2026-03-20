"use server";

import { getTranslations } from "next-intl/server";
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
  departmentIds?: string[]
): Promise<{ success: true; data: PlanningData } | { success: false; formError: string; fieldErrors?: Record<string, string[]> }> {
  try {
    const t = await getTranslations("planning");

    // 1. Resolve tenant context
    const ctx = await resolveTenantContext(organisationAlias);

    // 2. Validate input
    const tVal = await getTranslations("validation");
    const validationResult = getPlanningDataSchema(tVal).safeParse({
      fromLocalISO,
      toLocalISO,
      clientTimeZone,
      departmentIds,
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
        formError: t("errors.invalidData"),
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
    const t = await getTranslations("planning");
    const formState = await mapErrorToFormState(error);
    return {
      success: false,
      formError: formState.formError ?? t("errors.fetchError"),
      fieldErrors: formState.fieldErrors,
    };
  }
}

