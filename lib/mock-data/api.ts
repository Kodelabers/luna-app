"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Application,
  ApplicationStatus,
  UnavailabilityLedgerEntry,
  LedgerEntryType,
} from "@/lib/types";
import {
  mockApplications,
  mockLedgerEntries,
} from "@/lib/mock-data/generator";
import { calculateWorkingDays } from "@/lib/utils/workdays";
import { mockHolidays } from "@/lib/mock-data/generator";

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

