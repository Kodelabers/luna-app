import { ValidationError } from "@/lib/types";
import { Application, ApplicationStatus } from "@/lib/types";
import { findOverlappingApps, hasOverlap } from "@/lib/utils/overlap";
import { calculateWorkingDays } from "@/lib/utils/workdays";
import { mockHolidays } from "@/lib/mock-data/generator";

/**
 * Validate date range for an application
 * BR-VAL-001: Validacija datuma zahtjeva
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date
): ValidationError[] {
  const errors: ValidationError[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // Start date must not be in the past
  if (start < today) {
    errors.push({
      field: "startDate",
      message: "Datum početka ne smije biti u prošlosti",
    });
  }

  // End date must not be more than 365 days in the future
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 365);
  if (end > maxDate) {
    errors.push({
      field: "endDate",
      message: "Datum završetka ne smije biti više od 365 dana u budućnosti",
    });
  }

  // Start date must be before or equal to end date
  if (start > end) {
    errors.push({
      field: "startDate",
      message: "Datum početka mora biti prije ili jednak datumu završetka",
    });
  }

  return errors;
}

/**
 * Validate minimum workdays
 * BR-VAL-004: Validacija minimalne duljine
 */
export function validateMinWorkdays(
  startDate: Date,
  endDate: Date
): ValidationError[] {
  const errors: ValidationError[] = [];
  const workdays = calculateWorkingDays(startDate, endDate, mockHolidays);

  if (workdays < 1) {
    errors.push({
      field: "dateRange",
      message: "Zahtjev mora uključivati barem jedan radni dan",
    });
  }

  return errors;
}

/**
 * Validate overlap with existing applications
 * BR-VAL-002: Validacija preklapanja zahtjeva
 */
export function validateOverlap(
  newApp: Partial<Application>,
  existingApps: Application[],
  excludeApplicationId?: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    !newApp.startDate ||
    !newApp.endDate ||
    !newApp.employeeId ||
    !newApp.unavailabilityReasonId
  ) {
    return errors; // Can't validate without required fields
  }

  const tempApp: Application = {
    id: excludeApplicationId || -1,
    organisationId: newApp.organisationId || 1,
    departmentId: newApp.departmentId || 1,
    employeeId: newApp.employeeId,
    unavailabilityReasonId: newApp.unavailabilityReasonId,
    startDate: newApp.startDate,
    endDate: newApp.endDate,
    status: ApplicationStatus.DRAFT,
    active: true,
    createdAt: new Date(),
    createdById: newApp.employeeId,
    updatedAt: new Date(),
  };

  const overlapping = findOverlappingApps(tempApp, existingApps);

  if (overlapping.length > 0) {
    const overlappingDetails = overlapping
      .map(
        (app) =>
          `${app.startDate.toLocaleDateString("hr-HR")} - ${app.endDate.toLocaleDateString("hr-HR")}`
      )
      .join(", ");

    errors.push({
      field: "dateRange",
      message: `Zahtjev se preklapa s postojećim zahtjevom: ${overlappingDetails}`,
    });
  }

  return errors;
}

/**
 * Validate balance availability
 * BR-VAL-003: Validacija dostupnih dana
 */
export function validateBalance(
  available: number,
  requestedDays: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (requestedDays > available) {
    errors.push({
      field: "dateRange",
      message: `Nemate dovoljno dostupnih dana. Tražite ${requestedDays} dana, a imate ${available} dana na raspolaganju.`,
    });
  }

  return errors;
}

/**
 * Validate all application fields
 * Combines all validations in the correct order
 */
export function validateApplication(
  newApp: Partial<Application>,
  existingApps: Application[],
  available: number,
  excludeApplicationId?: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Date range validation (BR-VAL-001)
  if (newApp.startDate && newApp.endDate) {
    errors.push(...validateDateRange(newApp.startDate, newApp.endDate));
  }

  // 2. Min workdays validation (BR-VAL-004)
  if (newApp.startDate && newApp.endDate) {
    errors.push(...validateMinWorkdays(newApp.startDate, newApp.endDate));
  }

  // 3. Overlap validation (BR-VAL-002) - only if dates are valid
  if (
    newApp.startDate &&
    newApp.endDate &&
    !errors.some((e) => e.field === "startDate" || e.field === "endDate")
  ) {
    errors.push(...validateOverlap(newApp, existingApps, excludeApplicationId));
  }

  // 4. Balance validation (BR-VAL-003) - only if dates are valid
  if (
    newApp.startDate &&
    newApp.endDate &&
    newApp.requestedWorkdays &&
    !errors.some((e) => e.field === "dateRange")
  ) {
    errors.push(...validateBalance(available, newApp.requestedWorkdays));
  }

  return errors;
}

