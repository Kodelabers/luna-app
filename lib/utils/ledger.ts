import {
  UnavailabilityLedgerEntry,
  LedgerEntryType,
  Application,
  ApplicationStatus,
} from "@/lib/types";

/**
 * Get all ledger entries for a specific employee, reason, and year
 */
export function getEntriesForEmployee(
  entries: UnavailabilityLedgerEntry[],
  employeeId: number,
  unavailabilityReasonId: number,
  year: number
): UnavailabilityLedgerEntry[] {
  return entries.filter(
    (entry) =>
      entry.employeeId === employeeId &&
      entry.unavailabilityReasonId === unavailabilityReasonId &&
      entry.year === year
  );
}

/**
 * Calculate balance from ledger entries
 */
export function calculateBalance(
  entries: UnavailabilityLedgerEntry[],
  employeeId: number,
  unavailabilityReasonId: number,
  year: number
): {
  allocated: number;
  used: number;
  pending: number;
  available: number;
} {
  const filteredEntries = getEntriesForEmployee(
    entries,
    employeeId,
    unavailabilityReasonId,
    year
  );

  // Calculate allocated (ALLOCATION + TRANSFER)
  const allocated = filteredEntries
    .filter(
      (e) =>
        e.type === LedgerEntryType.ALLOCATION ||
        e.type === LedgerEntryType.TRANSFER
    )
    .reduce((sum, e) => sum + e.changeDays, 0);

  // Calculate used (USAGE - negative values, so we take absolute)
  const used = Math.abs(
    filteredEntries
      .filter((e) => e.type === LedgerEntryType.USAGE)
      .reduce((sum, e) => sum + e.changeDays, 0)
  );

  // Pending is calculated from applications, not ledger
  // This will be calculated separately in the hook
  const pending = 0;

  const available = allocated - used - pending;

  return {
    allocated,
    used,
    pending,
    available,
  };
}

/**
 * Calculate pending days from applications
 */
export function calculatePendingDays(
  applications: Application[],
  employeeId: number,
  unavailabilityReasonId: number
): number {
  const pendingApplications = applications.filter(
    (app) =>
      app.employeeId === employeeId &&
      app.unavailabilityReasonId === unavailabilityReasonId &&
      (app.status === ApplicationStatus.SUBMITTED ||
        app.status === ApplicationStatus.APPROVED_FIRST_LEVEL) &&
      app.active
  );

  return pendingApplications.reduce(
    (sum, app) => sum + (app.requestedWorkdays || 0),
    0
  );
}

/**
 * Get all ledger entries grouped by type
 */
export function groupEntriesByType(
  entries: UnavailabilityLedgerEntry[]
): {
  allocations: UnavailabilityLedgerEntry[];
  usages: UnavailabilityLedgerEntry[];
  transfers: UnavailabilityLedgerEntry[];
  corrections: UnavailabilityLedgerEntry[];
} {
  return {
    allocations: entries.filter(
      (e) => e.type === LedgerEntryType.ALLOCATION
    ),
    usages: entries.filter((e) => e.type === LedgerEntryType.USAGE),
    transfers: entries.filter((e) => e.type === LedgerEntryType.TRANSFER),
    corrections: entries.filter(
      (e) => e.type === LedgerEntryType.CORRECTION
    ),
  };
}

