"use client";

import { useMemo } from "react";
import {
  calculateBalance,
  calculatePendingDays,
} from "@/lib/utils/ledger";
import {
  mockLedgerEntries,
  mockApplications,
} from "@/lib/mock-data/generator";
import { UnavailabilityLedgerEntry, Application } from "@/lib/types";

/**
 * Hook to calculate balance for an employee's unavailability reason
 * @param employeeId - Employee ID
 * @param unavailabilityReasonId - Unavailability reason ID (e.g., 1 for "Godišnji odmor")
 * @param year - Year to calculate balance for
 * @param customLedgerEntries - Optional custom ledger entries (for testing or state management)
 * @param customApplications - Optional custom applications (for testing or state management)
 */
export function useBalance(
  employeeId: number,
  unavailabilityReasonId: number,
  year: number,
  customLedgerEntries?: UnavailabilityLedgerEntry[],
  customApplications?: Application[]
) {
  const ledgerEntries = customLedgerEntries || mockLedgerEntries;
  const applications = customApplications || mockApplications;

  const balance = useMemo(() => {
    // Calculate base balance from ledger
    const baseBalance = calculateBalance(
      ledgerEntries,
      employeeId,
      unavailabilityReasonId,
      year
    );

    // Calculate pending days from applications
    const pending = calculatePendingDays(
      applications,
      employeeId,
      unavailabilityReasonId
    );

    // Calculate available (allocated - used - pending)
    const available = baseBalance.allocated - baseBalance.used - pending;

    return {
      allocated: baseBalance.allocated,
      used: baseBalance.used,
      pending,
      available,
    };
  }, [employeeId, unavailabilityReasonId, year, ledgerEntries, applications]);

  return balance;
}

