import { Application, ApplicationStatus } from "@/lib/types";

/**
 * Check if two applications overlap in date range
 * Overlap occurs when: (StartNew <= EndExist) AND (EndNew >= StartExist)
 */
export function detectOverlap(
  app1: Application,
  app2: Application
): boolean {
  const start1 = new Date(app1.startDate).getTime();
  const end1 = new Date(app1.endDate).getTime();
  const start2 = new Date(app2.startDate).getTime();
  const end2 = new Date(app2.endDate).getTime();

  return start1 <= end2 && end1 >= start2;
}

/**
 * Find all applications that overlap with the given application
 */
export function findOverlappingApps(
  newApp: Application,
  existingApps: Application[]
): Application[] {
  return existingApps.filter((existingApp) => {
    // Don't check overlap with itself
    if (existingApp.id === newApp.id) {
      return false;
    }

    // Only check overlap with active applications that need approval or are approved
    const relevantStatuses = [
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.APPROVED_FIRST_LEVEL,
      ApplicationStatus.APPROVED,
    ];

    if (
      !existingApp.active ||
      !relevantStatuses.includes(existingApp.status)
    ) {
      return false;
    }

    // Check if same employee and same reason
    if (
      existingApp.employeeId !== newApp.employeeId ||
      existingApp.unavailabilityReasonId !== newApp.unavailabilityReasonId
    ) {
      return false;
    }

    return detectOverlap(newApp, existingApp);
  });
}

/**
 * Check if a date range overlaps with any existing applications
 */
export function hasOverlap(
  startDate: Date,
  endDate: Date,
  employeeId: number,
  unavailabilityReasonId: number,
  existingApps: Application[],
  excludeApplicationId?: number
): boolean {
  const tempApp: Application = {
    id: excludeApplicationId || -1,
    organisationId: 1,
    departmentId: 1,
    employeeId,
    unavailabilityReasonId,
    startDate,
    endDate,
    status: ApplicationStatus.DRAFT,
    active: true,
    createdAt: new Date(),
    createdById: employeeId,
    updatedAt: new Date(),
  };

  const overlapping = findOverlappingApps(tempApp, existingApps);
  return overlapping.length > 0;
}

