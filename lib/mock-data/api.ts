"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Application,
  ApplicationStatus,
  UnavailabilityLedgerEntry,
  LedgerEntryType,
  MockUser,
  DaySchedule,
  DayCode,
  EmployeeStatus,
} from "@/lib/types";
import {
  mockApplications,
  mockLedgerEntries,
  mockUnavailabilityReasons,
  mockDaySchedules,
  mockHolidays,
} from "@/lib/mock-data/generator";
import { generateDateRange, isWeekend, isDateInRange } from "@/lib/utils/dates";
import { isHoliday, calculateWorkingDays } from "@/lib/utils/workdays";
import {
  canApprove,
  canReject,
  getNextStatus,
  shouldCreateLedgerEntry,
} from "@/lib/utils/application";
import { formatDateRange } from "@/lib/utils/dates";

const STORAGE_KEY_APPLICATIONS = "luna_mock_applications";
const STORAGE_KEY_LEDGER = "luna_mock_ledger";
const STORAGE_KEY_DAYSCHEDULE = "luna_mock_dayschedule";

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
 * Must be used together with useMockApplications, useMockLedgerEntries, and useMockDaySchedules
 */
export function useApprovalActions(
  applications: Application[],
  updateApplication: (id: number, data: Partial<Application>) => void,
  createLedgerEntry: (
    data: Omit<UnavailabilityLedgerEntry, "id" | "createdAt">
  ) => UnavailabilityLedgerEntry,
  createDaySchedulesForApplication?: (application: Application) => DaySchedule[]
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

      // Update application with manager comment if provided
      updateApplication(applicationId, {
        status: newStatus,
        lastUpdatedById: manager.employeeId,
        managerComment: comment || undefined,
      });

      // Create ledger entry if needed (only for APPROVED status with hasPlanning=true)
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

        // Create DaySchedule entries for APPROVED applications with hasPlanning=true
        // DaySchedule is only created for final approval (APPROVED), not for APPROVED_FIRST_LEVEL
        if (
          newStatus === ApplicationStatus.APPROVED &&
          reason.hasPlanning &&
          createDaySchedulesForApplication
        ) {
          createDaySchedulesForApplication(application);
        }
      }

      return { success: true };
    },
    [applications, updateApplication, createLedgerEntry, createDaySchedulesForApplication]
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

      // Update application with rejection comment
      updateApplication(applicationId, {
        status: ApplicationStatus.REJECTED,
        lastUpdatedById: manager.employeeId,
        rejectionComment: comment,
        managerComment: comment, // Also store in managerComment for consistency
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

/**
 * Helper function to get DayCode from date
 */
function getDayCode(date: Date): DayCode {
  const day = date.getDay();
  switch (day) {
    case 0:
      return DayCode.SUN;
    case 1:
      return DayCode.MON;
    case 2:
      return DayCode.TUE;
    case 3:
      return DayCode.WED;
    case 4:
      return DayCode.THU;
    case 5:
      return DayCode.FRI;
    case 6:
      return DayCode.SAT;
    default:
      return DayCode.MON;
  }
}

/**
 * Hook for managing DaySchedule entries with state
 */
export function useMockDaySchedules() {
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(() => {
    if (typeof window === "undefined") {
      return mockDaySchedules;
    }

    const stored = localStorage.getItem(STORAGE_KEY_DAYSCHEDULE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));
      } catch {
        return mockDaySchedules;
      }
    }
    return mockDaySchedules;
  });

  // Save to localStorage whenever day schedules change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DAYSCHEDULE, JSON.stringify(daySchedules));
    }
  }, [daySchedules]);

  const createDaySchedule = useCallback(
    (
      data: Omit<DaySchedule, "id" | "createdAt" | "updatedAt">
    ): DaySchedule => {
      const newId =
        daySchedules.length > 0
          ? Math.max(...daySchedules.map((ds) => ds.id), 0) + 1
          : 1;

      const newEntry: DaySchedule = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setDaySchedules((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [daySchedules]
  );

  const createDaySchedulesForApplication = useCallback(
    (application: Application): DaySchedule[] => {
      const dates = generateDateRange(application.startDate, application.endDate);
      const entries: DaySchedule[] = [];

      for (const date of dates) {
        const weekend = isWeekend(date);
        const holiday = isHoliday(date, mockHolidays);

        // Only create entries for working days (not weekends or holidays)
        // But we still create entries for all days to track the full period
        // The status will be NOT_AVAILABLE for all days in the range
        const entry = createDaySchedule({
          organisationId: application.organisationId,
          employeeId: application.employeeId,
          applicationId: application.id,
          unavailabilityReasonId: application.unavailabilityReasonId,
          date: new Date(date),
          dayCode: getDayCode(date),
          isWeekend: weekend,
          isHoliday: holiday,
          status: EmployeeStatus.NOT_AVAILABLE,
          active: true,
        });

        entries.push(entry);
      }

      return entries;
    },
    [createDaySchedule]
  );

  const deleteDaySchedulesForApplication = useCallback(
    (applicationId: number): void => {
      setDaySchedules((prev) =>
        prev.filter((ds) => ds.applicationId !== applicationId)
      );
    },
    []
  );

  const findOverlappingDaySchedules = useCallback(
    (
      employeeId: number,
      startDate: Date,
      endDate: Date,
      excludeApplicationId?: number
    ): DaySchedule[] => {
      return daySchedules.filter(
        (ds) =>
          ds.employeeId === employeeId &&
          ds.active &&
          ds.status === EmployeeStatus.NOT_AVAILABLE &&
          ds.applicationId !== excludeApplicationId &&
          isDateInRange(ds.date, startDate, endDate)
      );
    },
    [daySchedules]
  );

  return {
    daySchedules,
    createDaySchedule,
    createDaySchedulesForApplication,
    deleteDaySchedulesForApplication,
    findOverlappingDaySchedules,
  };
}

