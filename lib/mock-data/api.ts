"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Application,
  ApplicationStatus,
  UnavailabilityLedgerEntry,
  LedgerEntryType,
  MockUser,
} from "@/lib/types";
import {
  mockApplications,
  mockLedgerEntries,
  mockUnavailabilityReasons,
} from "@/lib/mock-data/generator";
import { calculateWorkingDays } from "@/lib/utils/workdays";
import { mockHolidays } from "@/lib/mock-data/generator";
import {
  canApprove,
  canReject,
  getNextStatus,
  shouldCreateLedgerEntry,
} from "@/lib/utils/application";
import { formatDateRange } from "@/lib/utils/dates";

const STORAGE_KEY_APPLICATIONS = "luna_mock_applications";
const STORAGE_KEY_LEDGER = "luna_mock_ledger";

/**
 * Hook for managing applications with state
 */
export function useMockApplications() {
  const [applications, setApplications] = useState<Application[]>(() => {
    if (typeof window === "undefined") {
      return mockApplications;
    }

    const stored = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((app: any) => ({
          ...app,
          startDate: new Date(app.startDate),
          endDate: new Date(app.endDate),
          createdAt: new Date(app.createdAt),
          updatedAt: new Date(app.updatedAt),
        }));
      } catch {
        return mockApplications;
      }
    }
    return mockApplications;
  });

  // Save to localStorage whenever applications change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEY_APPLICATIONS,
        JSON.stringify(applications)
      );
    }
  }, [applications]);

  const createApplication = useCallback(
    (data: Omit<Application, "id" | "createdAt" | "updatedAt">) => {
      const newId =
        Math.max(...applications.map((a) => a.id), 0) + 1;

      // Calculate workdays if not provided
      const requestedWorkdays =
        data.requestedWorkdays ||
        calculateWorkingDays(data.startDate, data.endDate, mockHolidays);

      const newApplication: Application = {
        ...data,
        id: newId,
        requestedWorkdays,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setApplications((prev) => [...prev, newApplication]);
      return newApplication;
    },
    [applications]
  );

  const updateApplication = useCallback(
    (id: number, data: Partial<Application>) => {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id
            ? {
                ...app,
                ...data,
                updatedAt: new Date(),
              }
            : app
        )
      );
    },
    []
  );

  const deleteApplication = useCallback((id: number) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }, []);

  const submitApplication = useCallback(
    (id: number, status: ApplicationStatus = ApplicationStatus.SUBMITTED) => {
      updateApplication(id, { status });
    },
    [updateApplication]
  );

  return {
    applications,
    createApplication,
    updateApplication,
    deleteApplication,
    submitApplication,
  };
}

/**
 * Hook that provides approval functions
 * Must be used together with useMockApplications and useMockLedgerEntries
 */
export function useApprovalActions(
  applications: Application[],
  updateApplication: (id: number, data: Partial<Application>) => void,
  createLedgerEntry: (
    data: Omit<UnavailabilityLedgerEntry, "id" | "createdAt">
  ) => UnavailabilityLedgerEntry
) {
  const approveApplication = useCallback(
    (
      applicationId: number,
      manager: MockUser,
      comment?: string
    ): { success: boolean; error?: string } => {
      const application = applications.find((app) => app.id === applicationId);
      if (!application) {
        return { success: false, error: "Zahtjev nije pronađen" };
      }

      // Check permissions
      const permissionCheck = canApprove(manager, application);
      if (!permissionCheck.canApprove) {
        return {
          success: false,
          error: permissionCheck.reason || "Nemate pravo odobriti ovaj zahtjev",
        };
      }

      // Get unavailability reason
      const reason = mockUnavailabilityReasons.find(
        (r) => r.id === application.unavailabilityReasonId
      );
      if (!reason) {
        return { success: false, error: "Tip nedostupnosti nije pronađen" };
      }

      // Determine next status
      const newStatus = getNextStatus(
        application,
        reason,
        manager.role as "DEPARTMENT_MANAGER" | "GENERAL_MANAGER"
      );

      // Update application
      updateApplication(applicationId, {
        status: newStatus,
        lastUpdatedById: manager.employeeId,
      });

      // Create ledger entry if needed
      if (shouldCreateLedgerEntry(newStatus, reason)) {
        const year = new Date(application.startDate).getFullYear();
        createLedgerEntry({
          organisationId: application.organisationId,
          employeeId: application.employeeId,
          unavailabilityReasonId: application.unavailabilityReasonId,
          year,
          changeDays: -(application.requestedWorkdays || 0),
          type: LedgerEntryType.USAGE,
          applicationId: application.id,
          note: `${reason.name} ${formatDateRange(
            application.startDate,
            application.endDate
          )}`,
          createdById: manager.employeeId,
        });
      }

      return { success: true };
    },
    [applications, updateApplication, createLedgerEntry]
  );

  const rejectApplication = useCallback(
    (
      applicationId: number,
      manager: MockUser,
      comment: string
    ): { success: boolean; error?: string } => {
      const application = applications.find((app) => app.id === applicationId);
      if (!application) {
        return { success: false, error: "Zahtjev nije pronađen" };
      }

      // Validate comment
      if (!comment || comment.trim().length === 0) {
        return {
          success: false,
          error: "Razlog odbijanja je obavezan",
        };
      }

      // Check permissions
      const permissionCheck = canReject(manager, application);
      if (!permissionCheck.canReject) {
        return {
          success: false,
          error: permissionCheck.reason || "Nemate pravo odbiti ovaj zahtjev",
        };
      }

      // Update application
      updateApplication(applicationId, {
        status: ApplicationStatus.REJECTED,
        lastUpdatedById: manager.employeeId,
      });

      return { success: true };
    },
    [applications, updateApplication]
  );

  return {
    approveApplication,
    rejectApplication,
  };
}

/**
 * Hook for managing ledger entries with state
 */
export function useMockLedgerEntries() {
  const [ledgerEntries, setLedgerEntries] = useState<
    UnavailabilityLedgerEntry[]
  >(() => {
    if (typeof window === "undefined") {
      return mockLedgerEntries;
    }

    const stored = localStorage.getItem(STORAGE_KEY_LEDGER);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
        }));
      } catch {
        return mockLedgerEntries;
      }
    }
    return mockLedgerEntries;
  });

  // Save to localStorage whenever ledger entries change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(ledgerEntries));
    }
  }, [ledgerEntries]);

  const createLedgerEntry = useCallback(
    (
      data: Omit<
        UnavailabilityLedgerEntry,
        "id" | "createdAt"
      >
    ) => {
      const newId =
        Math.max(...ledgerEntries.map((e) => e.id), 0) + 1;

      const newEntry: UnavailabilityLedgerEntry = {
        ...data,
        id: newId,
        createdAt: new Date(),
      };

      setLedgerEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [ledgerEntries]
  );

  return {
    ledgerEntries,
    createLedgerEntry,
  };
}

