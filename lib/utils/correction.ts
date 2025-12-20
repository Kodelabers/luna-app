import {
  Application,
  ApplicationStatus,
  DaySchedule,
  UnavailabilityReason,
  EmployeeStatus,
} from "@/lib/types";
import { isDateInRange, generateDateRange } from "./dates";
import { calculateWorkingDays } from "./workdays";
import { mockHolidays } from "@/lib/mock-data/generator";

/**
 * Result of a correction operation
 */
export interface CorrectionResult {
  originalApplicationId: number;
  daysReturned: number; // SVI preostali dani (od početka novog do kraja originalnog)
  correctionStartDate: Date; // Početak vraćanja (početak novog zahtjeva)
  correctionEndDate: Date; // Kraj vraćanja (kraj originalnog zahtjeva)
}

/**
 * Find APPROVED applications that overlap with the new application via DaySchedule
 * 
 * @param newApplication - The new application being approved
 * @param daySchedules - All DaySchedule entries
 * @param applications - All applications
 * @param unavailabilityReasons - All unavailability reasons (to check hasPlanning)
 * @returns Array of APPROVED applications that overlap
 */
export function findOverlappingApprovedApplications(
  newApplication: Application,
  daySchedules: DaySchedule[],
  applications: Application[],
  unavailabilityReasons: UnavailabilityReason[]
): Application[] {
  // Find DaySchedule entries that overlap with the new application
  const overlappingSchedules = daySchedules.filter((schedule) => {
    return (
      schedule.employeeId === newApplication.employeeId &&
      schedule.status === EmployeeStatus.NOT_AVAILABLE &&
      isDateInRange(schedule.date, newApplication.startDate, newApplication.endDate) &&
      schedule.applicationId !== null &&
      schedule.applicationId !== undefined
    );
  });

  // Get unique application IDs from overlapping schedules
  const overlappingApplicationIds = new Set(
    overlappingSchedules
      .map((s) => s.applicationId)
      .filter((id): id is number => id !== null && id !== undefined)
  );

  // Find the actual applications and filter for APPROVED status
  const overlappingApps = applications.filter(
    (app) =>
      overlappingApplicationIds.has(app.id) &&
      app.status === ApplicationStatus.APPROVED &&
      app.active &&
      app.id !== newApplication.id
  );

  // Filter to only include apps where the unavailability reason has hasPlanning=true
  return overlappingApps.filter((app) => {
    const reason = unavailabilityReasons.find((r) => r.id === app.unavailabilityReasonId);
    return reason?.hasPlanning === true;
  });
}

/**
 * Calculate ALL remaining days from the start of the new application to the end of the original application
 * This is the key innovation: we return ALL remaining days, not just overlapping ones
 * 
 * @param newAppStart - Start date of the new application
 * @param originalApp - The original APPROVED application
 * @returns Number of working days from newAppStart to originalApp.endDate
 */
export function calculateRemainingDays(
  newAppStart: Date,
  originalApp: Application
): number {
  // If new app starts after original app ends, no days to return
  if (newAppStart > originalApp.endDate) {
    return 0;
  }

  // If new app starts before original app starts, return all days of original app
  if (newAppStart <= originalApp.startDate) {
    return originalApp.requestedWorkdays || 0;
  }

  // Calculate working days from newAppStart to originalApp.endDate
  // This is the key: we return ALL remaining days, not just overlapping ones
  const startDate = new Date(newAppStart);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(originalApp.endDate);
  endDate.setHours(23, 59, 59, 999);

  return calculateWorkingDays(startDate, endDate, mockHolidays);
}

/**
 * Check if correction should be performed
 * 
 * @param newApplication - The new application being approved
 * @param daySchedules - All DaySchedule entries
 * @param applications - All applications
 * @param unavailabilityReasons - All unavailability reasons
 * @returns true if correction should be performed
 */
export function shouldPerformCorrection(
  newApplication: Application,
  daySchedules: DaySchedule[],
  applications: Application[],
  unavailabilityReasons: UnavailabilityReason[]
): boolean {
  // Correction only for APPROVED status (final approval)
  if (newApplication.status !== ApplicationStatus.APPROVED) {
    return false;
  }

  // Check if new application's reason has hasPlanning=true
  const newAppReason = unavailabilityReasons.find(
    (r) => r.id === newApplication.unavailabilityReasonId
  );
  if (!newAppReason || !newAppReason.hasPlanning) {
    return false;
  }

  // Check if there are overlapping APPROVED applications
  const overlappingApps = findOverlappingApprovedApplications(
    newApplication,
    daySchedules,
    applications,
    unavailabilityReasons
  );

  return overlappingApps.length > 0;
}

/**
 * Calculate correction results for all overlapping applications
 * 
 * @param newApplication - The new application being approved
 * @param daySchedules - All DaySchedule entries
 * @param applications - All applications
 * @param unavailabilityReasons - All unavailability reasons
 * @returns Array of correction results
 */
export function calculateCorrections(
  newApplication: Application,
  daySchedules: DaySchedule[],
  applications: Application[],
  unavailabilityReasons: UnavailabilityReason[]
): CorrectionResult[] {
  const overlappingApps = findOverlappingApprovedApplications(
    newApplication,
    daySchedules,
    applications,
    unavailabilityReasons
  );

  return overlappingApps.map((originalApp) => {
    const daysReturned = calculateRemainingDays(
      newApplication.startDate,
      originalApp
    );

    return {
      originalApplicationId: originalApp.id,
      daysReturned,
      correctionStartDate: new Date(newApplication.startDate),
      correctionEndDate: new Date(originalApp.endDate),
    };
  });
}

