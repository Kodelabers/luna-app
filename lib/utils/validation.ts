import { ValidationError, DaySchedule, UnavailabilityReason, EmployeeStatus } from "@/lib/types";
import { Application, ApplicationStatus } from "@/lib/types";
import { findOverlappingApps, hasOverlap } from "@/lib/utils/overlap";
import { calculateWorkingDays } from "@/lib/utils/workdays";
import { mockHolidays, mockUnavailabilityReasons } from "@/lib/mock-data/generator";
import { isDateInRange } from "@/lib/utils/dates";

/**
 * Validate date range for an application
 * BR-VAL-001: Validacija datuma zahtjeva
 * 
 * @param startDate - Start date of the application
 * @param endDate - End date of the application
 * @param unavailabilityReasonId - Optional ID of the unavailability reason (e.g., 2 for "Bolovanje")
 *                                  If provided and reason is "Bolovanje", past dates are allowed
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
  unavailabilityReasonId?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  // Check if this is a sick leave (Bolovanje) - id: 2
  // Sick leave allows past dates for retroactive documentation
  const isSickLeave = unavailabilityReasonId === 2;
  const reason = unavailabilityReasonId
    ? mockUnavailabilityReasons.find((r) => r.id === unavailabilityReasonId)
    : null;
  const allowPastDates = isSickLeave || reason?.name === "Bolovanje";

  // Start date must not be in the past (except for sick leave)
  if (start < today && !allowPastDates) {
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
 * Validate overlap with DaySchedule (APPROVED applications)
 * BR-VAL-002: Validacija preklapanja s DaySchedule-om
 * US-VAL-007: Provjera preklapanja s DaySchedule-om i korekcija pri odobrenju
 * 
 * @param newApp - New application being validated
 * @param daySchedules - Array of DaySchedule entries (from APPROVED applications)
 * @param unavailabilityReasons - Array of UnavailabilityReason to check hasPlanning flag
 * @returns Array of validation errors (warnings about future correction)
 */
export function validateDayScheduleOverlap(
  newApp: Partial<Application>,
  daySchedules: DaySchedule[],
  unavailabilityReasons: UnavailabilityReason[] = mockUnavailabilityReasons
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

  // Find the unavailability reason to check hasPlanning flag
  const reason = unavailabilityReasons.find(
    (r) => r.id === newApp.unavailabilityReasonId
  );

  // Only check overlap if the new application has planning (hasPlanning=true)
  // and if there are DaySchedule entries for this employee
  if (!reason || !reason.hasPlanning) {
    return errors; // No planning needed, skip DaySchedule check
  }

  // Find overlapping DaySchedule entries for this employee
  const overlappingSchedules = daySchedules.filter(
    (schedule) =>
      schedule.employeeId === newApp.employeeId &&
      schedule.active &&
      schedule.status === EmployeeStatus.NOT_AVAILABLE &&
      isDateInRange(
        schedule.date,
        newApp.startDate,
        newApp.endDate
      )
  );

  if (overlappingSchedules.length > 0) {
    // Group by applicationId to show which applications will be affected
    const affectedApps = new Set(
      overlappingSchedules
        .map((s) => s.applicationId)
        .filter((id): id is number => id !== undefined)
    );

    // Get date ranges for affected applications
    const affectedDates = Array.from(affectedApps)
      .map((appId) => {
        const schedules = overlappingSchedules.filter(
          (s) => s.applicationId === appId
        );
        if (schedules.length === 0) return null;
        const dates = schedules.map((s) => s.date).sort((a, b) => a.getTime() - b.getTime());
        return {
          appId,
          start: dates[0],
          end: dates[dates.length - 1],
        };
      })
      .filter((item): item is { appId: number; start: Date; end: Date } => item !== null)
      .map(
        (item) =>
          `${item.start.toLocaleDateString("hr-HR")} - ${item.end.toLocaleDateString("hr-HR")}`
      )
      .join(", ");

    // This is a warning, not an error - the application can still be submitted
    // but will trigger a correction when approved
    errors.push({
      field: "dateRange",
      message: `Upozorenje: Zahtjev se preklapa s odobrenim zahtjevima u DaySchedule-u (${affectedDates}). Pri odobrenju će se automatski izvršiti korekcija - vraćanje SVIH preostalih dana iz preklopljenih zahtjeva i pregazivanje postojećeg plana.`,
    });
  }

  return errors;
}

/**
 * Validate all application fields
 * Combines all validations in the correct order
 * 
 * @param newApp - New application being validated
 * @param existingApps - Existing applications to check for overlap
 * @param available - Available days for the employee/reason/year
 * @param excludeApplicationId - Optional application ID to exclude from overlap check (for editing)
 * @param daySchedules - Optional DaySchedule entries to check for overlap with APPROVED applications
 * @param unavailabilityReasons - Optional UnavailabilityReason array (defaults to mock data)
 */
export function validateApplication(
  newApp: Partial<Application>,
  existingApps: Application[],
  available: number,
  excludeApplicationId?: number,
  daySchedules?: DaySchedule[],
  unavailabilityReasons?: UnavailabilityReason[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Date range validation (BR-VAL-001)
  // Pass unavailabilityReasonId to allow past dates for sick leave
  if (newApp.startDate && newApp.endDate) {
    errors.push(
      ...validateDateRange(
        newApp.startDate,
        newApp.endDate,
        newApp.unavailabilityReasonId
      )
    );
  }

  // 2. Min workdays validation (BR-VAL-004)
  if (newApp.startDate && newApp.endDate) {
    errors.push(...validateMinWorkdays(newApp.startDate, newApp.endDate));
  }

  // 3. Overlap validation (BR-VAL-002) - only if dates are valid
  // Check overlap with active applications (SUBMITTED, APPROVED_FIRST_LEVEL)
  if (
    newApp.startDate &&
    newApp.endDate &&
    !errors.some((e) => e.field === "startDate" || e.field === "endDate")
  ) {
    errors.push(...validateOverlap(newApp, existingApps, excludeApplicationId));
  }

  // 4. DaySchedule overlap validation (BR-VAL-002, US-VAL-007) - only if dates are valid
  // Check overlap with APPROVED applications via DaySchedule
  if (
    newApp.startDate &&
    newApp.endDate &&
    !errors.some((e) => e.field === "startDate" || e.field === "endDate")
  ) {
    const schedules = daySchedules || [];
    const reasons = unavailabilityReasons || mockUnavailabilityReasons;
    errors.push(
      ...validateDayScheduleOverlap(newApp, schedules, reasons)
    );
  }

  // 5. Balance validation (BR-VAL-003) - only if dates are valid
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

