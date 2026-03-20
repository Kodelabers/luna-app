/**
 * Standard FormState type for Server Actions
 * All form actions must return this type
 */
export type FormState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  data?: Record<string, unknown>;
};

/**
 * Initial form state for useActionState
 */
export const initialFormState: FormState = {};

// Domain Errors

/**
 * Resource not found (404)
 */
export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Access forbidden (403)
 */
export class ForbiddenError extends Error {
  constructor(message: string = "Access forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends Error {
  public fieldErrors: Record<string, string[]>;

  constructor(
    fieldErrors: Record<string, string[]>,
    message: string = "Validation failed"
  ) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Conflict error (409) - e.g., duplicate entry
 */
export class ConflictError extends Error {
  constructor(message: string = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

import { getTranslations } from "next-intl/server";

/**
 * Map domain errors to FormState for Server Actions
 */
export async function mapErrorToFormState(error: unknown): Promise<FormState> {
  if (error instanceof ValidationError) {
    return {
      success: false,
      fieldErrors: error.fieldErrors,
      formError: error.message,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      formError: error.message,
    };
  }

  if (error instanceof ForbiddenError) {
    return {
      success: false,
      formError: error.message,
    };
  }

  if (error instanceof ConflictError) {
    return {
      success: false,
      formError: error.message,
    };
  }

  // Unknown error - don't leak internal details
  console.error("Unexpected error:", error);
  const t = await getTranslations("errors");
  return {
    success: false,
    formError: t("unexpectedError"),
  };
}

/**
 * Create a success FormState
 */
export function successState(message?: string): FormState {
  return {
    success: true,
    message,
  };
}

