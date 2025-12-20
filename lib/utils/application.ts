import {
  Application,
  ApplicationStatus,
  UnavailabilityReason,
  MockUser,
} from "@/lib/types";
import { mockManagers } from "@/lib/mock-data/generator";

/**
 * Check if user can approve an application
 */
export function canApprove(
  user: MockUser,
  application: Application
): { canApprove: boolean; reason?: string } {
  // Must be Department Manager or General Manager
  if (
    user.role !== "DEPARTMENT_MANAGER" &&
    user.role !== "GENERAL_MANAGER"
  ) {
    return {
      canApprove: false,
      reason: "Samo manager može odobravati zahtjeve",
    };
  }

  // Department Manager checks
  if (user.role === "DEPARTMENT_MANAGER") {
    // Must have departmentId
    if (!user.departmentId) {
      return {
        canApprove: false,
        reason: "Manager mora biti povezan s odjelom",
      };
    }

    // Application must be from same department
    if (application.departmentId !== user.departmentId) {
      return {
        canApprove: false,
        reason: "Zahtjev nije iz vašeg odjela",
      };
    }

    // Cannot approve own requests
    if (application.employeeId === user.employeeId) {
      return {
        canApprove: false,
        reason: "Ne možete odobravati vlastite zahtjeve",
      };
    }

    // Can only approve SUBMITTED status (first level)
    if (application.status !== ApplicationStatus.SUBMITTED) {
      return {
        canApprove: false,
        reason: "Možete odobravati samo zahtjeve u statusu SUBMITTED",
      };
    }
  }

  // General Manager checks
  if (user.role === "GENERAL_MANAGER") {
    // Can only approve APPROVED_FIRST_LEVEL status (second level)
    if (application.status !== ApplicationStatus.APPROVED_FIRST_LEVEL) {
      return {
        canApprove: false,
        reason: "Možete odobravati samo zahtjeve u statusu APPROVED_FIRST_LEVEL",
      };
    }
  }

  return { canApprove: true };
}

/**
 * Check if user can reject an application
 */
export function canReject(
  user: MockUser,
  application: Application
): { canReject: boolean; reason?: string } {
  // Must be Department Manager or General Manager
  if (
    user.role !== "DEPARTMENT_MANAGER" &&
    user.role !== "GENERAL_MANAGER"
  ) {
    return {
      canReject: false,
      reason: "Samo manager može odbijati zahtjeve",
    };
  }

  // Department Manager checks
  if (user.role === "DEPARTMENT_MANAGER") {
    // Must have departmentId
    if (!user.departmentId) {
      return {
        canReject: false,
        reason: "Manager mora biti povezan s odjelom",
      };
    }

    // Application must be from same department
    if (application.departmentId !== user.departmentId) {
      return {
        canReject: false,
        reason: "Zahtjev nije iz vašeg odjela",
      };
    }

    // Cannot reject own requests
    if (application.employeeId === user.employeeId) {
      return {
        canReject: false,
        reason: "Ne možete odbijati vlastite zahtjeve",
      };
    }

    // Can reject SUBMITTED status
    if (application.status !== ApplicationStatus.SUBMITTED) {
      return {
        canReject: false,
        reason: "Možete odbijati samo zahtjeve u statusu SUBMITTED",
      };
    }
  }

  // General Manager checks
  if (user.role === "GENERAL_MANAGER") {
    // Can reject SUBMITTED or APPROVED_FIRST_LEVEL
    if (
      application.status !== ApplicationStatus.SUBMITTED &&
      application.status !== ApplicationStatus.APPROVED_FIRST_LEVEL
    ) {
      return {
        canReject: false,
        reason:
          "Možete odbijati samo zahtjeve u statusu SUBMITTED ili APPROVED_FIRST_LEVEL",
      };
    }
  }

  return { canReject: true };
}

/**
 * Determine next status after approval
 */
export function getNextStatus(
  application: Application,
  reason: UnavailabilityReason,
  userRole: "DEPARTMENT_MANAGER" | "GENERAL_MANAGER"
): ApplicationStatus {
  if (userRole === "DEPARTMENT_MANAGER") {
    // First level approval
    if (reason.needSecondApproval) {
      return ApplicationStatus.APPROVED_FIRST_LEVEL;
    } else {
      return ApplicationStatus.APPROVED;
    }
  } else {
    // General Manager - second level approval
    return ApplicationStatus.APPROVED;
  }
}

/**
 * Check if ledger entry should be created
 */
export function shouldCreateLedgerEntry(
  status: ApplicationStatus,
  reason: UnavailabilityReason
): boolean {
  // Only create ledger entry if:
  // 1. Status is APPROVED (final approval)
  // 2. Reason has planning (hasPlanning = true)
  return (
    status === ApplicationStatus.APPROVED && reason.hasPlanning === true
  );
}

