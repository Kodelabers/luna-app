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
  Employee,
  Department,
  Manager,
  Holiday,
} from "@/lib/types";
import {
  mockApplications,
  mockLedgerEntries,
  mockUnavailabilityReasons,
  mockDaySchedules,
  mockHolidays,
  mockEmployees,
  mockDepartments,
  mockManagers,
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
import {
  shouldPerformCorrection,
  calculateCorrections,
  CorrectionResult,
} from "@/lib/utils/correction";

const STORAGE_KEY_APPLICATIONS = "luna_mock_applications";
const STORAGE_KEY_LEDGER = "luna_mock_ledger";
const STORAGE_KEY_DAYSCHEDULE = "luna_mock_dayschedule";
const STORAGE_KEY_EMPLOYEES = "luna_mock_employees";
const STORAGE_KEY_DEPARTMENTS = "luna_mock_departments";
const STORAGE_KEY_MANAGERS = "luna_mock_managers";
const STORAGE_KEY_HOLIDAYS = "luna_mock_holidays";

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
  createDaySchedulesForApplication?: (application: Application) => DaySchedule[],
  daySchedules?: DaySchedule[],
  deleteDaySchedulesInRange?: (
    applicationId: number,
    startDate: Date,
    endDate: Date
  ) => void
) {
  const approveApplication = useCallback(
    (
      applicationId: number,
      manager: MockUser,
      comment?: string
    ): { success: boolean; error?: string; corrections?: CorrectionResult[] } => {
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

      // Perform correction if needed (only for APPROVED status)
      let corrections: CorrectionResult[] = [];
      if (
        newStatus === ApplicationStatus.APPROVED &&
        daySchedules &&
        deleteDaySchedulesInRange &&
        shouldPerformCorrection(
          { ...application, status: newStatus },
          daySchedules,
          applications,
          mockUnavailabilityReasons
        )
      ) {
        // Calculate corrections for all overlapping applications
        corrections = calculateCorrections(
          { ...application, status: newStatus },
          daySchedules,
          applications,
          mockUnavailabilityReasons
        );

        // Process each correction
        for (const correction of corrections) {
          const originalApp = applications.find(
            (app) => app.id === correction.originalApplicationId
          );
          if (!originalApp) continue;

          // Create CORRECTION ledger entry (positive changeDays = return days)
          const year = new Date(originalApp.startDate).getFullYear();
          createLedgerEntry({
            organisationId: originalApp.organisationId,
            employeeId: originalApp.employeeId,
            unavailabilityReasonId: originalApp.unavailabilityReasonId,
            year,
            changeDays: +correction.daysReturned, // Positive = return days
            type: LedgerEntryType.CORRECTION,
            applicationId: originalApp.id,
            note: `Vraćeno zbog preklapanja s novim zahtjevom #${application.id} (${formatDateRange(
              application.startDate,
              application.endDate
            )}). Vraćeni dani: ${formatDateRange(
              correction.correctionStartDate,
              correction.correctionEndDate
            )}`,
            createdById: manager.employeeId,
          });

          // Delete DaySchedule entries in the correction range
          deleteDaySchedulesInRange(
            originalApp.id,
            correction.correctionStartDate,
            correction.correctionEndDate
          );

          // Add comment to original application
          const existingComment = originalApp.managerComment || "";
          const correctionComment = `Korekcija: Vraćeno ${correction.daysReturned} dana zbog preklapanja s novim zahtjevom #${application.id} (${formatDateRange(
            application.startDate,
            application.endDate
          )}). Vraćeni dani: ${formatDateRange(
            correction.correctionStartDate,
            correction.correctionEndDate
          )}.`;
          const newComment = existingComment
            ? `${existingComment}\n\n${correctionComment}`
            : correctionComment;

          updateApplication(originalApp.id, {
            managerComment: newComment,
          });
        }
      }

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
        // This happens AFTER correction, so new schedule overwrites the old one
        if (
          newStatus === ApplicationStatus.APPROVED &&
          reason.hasPlanning &&
          createDaySchedulesForApplication
        ) {
          createDaySchedulesForApplication(application);
        }
      }

      return { success: true, corrections: corrections.length > 0 ? corrections : undefined };
    },
    [
      applications,
      updateApplication,
      createLedgerEntry,
      createDaySchedulesForApplication,
      daySchedules,
      deleteDaySchedulesInRange,
    ]
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

  const deleteDaySchedulesInRange = useCallback(
    (
      applicationId: number,
      startDate: Date,
      endDate: Date
    ): void => {
      setDaySchedules((prev) =>
        prev.filter((ds) => {
          // Keep if not matching applicationId
          if (ds.applicationId !== applicationId) {
            return true;
          }
          // Delete if date is in range [startDate, endDate]
          return !isDateInRange(ds.date, startDate, endDate);
        })
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
    deleteDaySchedulesInRange,
    findOverlappingDaySchedules,
  };
}

/**
 * Hook for managing employees with state
 */
export function useMockEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (typeof window === "undefined") {
      return mockEmployees;
    }

    const stored = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((emp: any) => ({
          ...emp,
          createdAt: new Date(emp.createdAt),
          updatedAt: new Date(emp.updatedAt),
        }));
      } catch {
        return mockEmployees;
      }
    }
    return mockEmployees;
  });

  // Save to localStorage whenever employees change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    }
  }, [employees]);

  const createEmployee = useCallback(
    (
      data: Omit<Employee, "id" | "createdAt" | "updatedAt">,
      createLedgerEntry?: (
        data: Omit<UnavailabilityLedgerEntry, "id" | "createdAt">
      ) => UnavailabilityLedgerEntry,
      vacationDays: number = 20
    ) => {
      // Validate unique email
      const existingEmployee = employees.find((e) => e.email === data.email);
      if (existingEmployee) {
        throw new Error("Email već postoji u sustavu");
      }

      const newId = Math.max(...employees.map((e) => e.id), 0) + 1;

      const newEmployee: Employee = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setEmployees((prev) => [...prev, newEmployee]);

      // Auto-create ALLOCATION ledger entry for current year
      // Find the first unavailability reason with hasPlanning=true (usually "Godišnji odmor")
      const vacationReason = mockUnavailabilityReasons.find(
        (r) => r.hasPlanning && r.active
      );
      if (vacationReason && createLedgerEntry) {
        const currentYear = new Date().getFullYear();
        createLedgerEntry({
          organisationId: newEmployee.organisationId,
          employeeId: newEmployee.id,
          unavailabilityReasonId: vacationReason.id,
          year: currentYear,
          changeDays: vacationDays,
          type: LedgerEntryType.ALLOCATION,
          note: `Automatska dodjela za novog zaposlenika`,
        });
      }

      return newEmployee;
    },
    [employees]
  );

  const updateEmployee = useCallback(
    (id: number, data: Partial<Employee>) => {
      // Validate unique email if changed
      if (data.email) {
        const existingEmployee = employees.find(
          (e) => e.email === data.email && e.id !== id
        );
        if (existingEmployee) {
          throw new Error("Email već postoji u sustavu");
        }
      }

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                ...data,
                updatedAt: new Date(),
              }
            : emp
        )
      );
    },
    [employees]
  );

  const deleteEmployee = useCallback((id: number) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  }, []);

  const toggleEmployeeActive = useCallback(
    (id: number) => {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === id
            ? {
                ...emp,
                active: !emp.active,
                updatedAt: new Date(),
              }
            : emp
        )
      );
    },
    []
  );

  return {
    employees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeActive,
  };
}

/**
 * Hook for managing departments with state
 */
export function useMockDepartments() {
  const [departments, setDepartments] = useState<Department[]>(() => {
    if (typeof window === "undefined") {
      return mockDepartments;
    }

    const stored = localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((dept: any) => ({
          ...dept,
          createdAt: new Date(dept.createdAt),
          updatedAt: new Date(dept.updatedAt),
        }));
      } catch {
        return mockDepartments;
      }
    }
    return mockDepartments;
  });

  // Save to localStorage whenever departments change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(departments));
    }
  }, [departments]);

  const createDepartment = useCallback(
    (data: Omit<Department, "id" | "createdAt" | "updatedAt">) => {
      // Validate unique name
      const existingDept = departments.find((d) => d.name === data.name);
      if (existingDept) {
        throw new Error("Naziv odjela već postoji");
      }

      const newId = Math.max(...departments.map((d) => d.id), 0) + 1;

      const newDepartment: Department = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setDepartments((prev) => [...prev, newDepartment]);
      return newDepartment;
    },
    [departments]
  );

  const updateDepartment = useCallback(
    (id: number, data: Partial<Department>) => {
      // Validate unique name if changed
      if (data.name) {
        const existingDept = departments.find(
          (d) => d.name === data.name && d.id !== id
        );
        if (existingDept) {
          throw new Error("Naziv odjela već postoji");
        }
      }

      setDepartments((prev) =>
        prev.map((dept) =>
          dept.id === id
            ? {
                ...dept,
                ...data,
                updatedAt: new Date(),
              }
            : dept
        )
      );
    },
    [departments]
  );

  return {
    departments,
    createDepartment,
    updateDepartment,
  };
}

/**
 * Hook for managing managers with state
 */
export function useMockManagers() {
  const [managers, setManagers] = useState<Manager[]>(() => {
    if (typeof window === "undefined") {
      return mockManagers;
    }

    const stored = localStorage.getItem(STORAGE_KEY_MANAGERS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((mgr: any) => ({
          ...mgr,
          createdAt: new Date(mgr.createdAt),
          updatedAt: new Date(mgr.updatedAt),
        }));
      } catch {
        return mockManagers;
      }
    }
    return mockManagers;
  });

  // Save to localStorage whenever managers change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MANAGERS, JSON.stringify(managers));
    }
  }, [managers]);

  const assignDepartmentManager = useCallback(
    (
      employeeId: number,
      departmentId: number,
      employees: Employee[]
    ): Manager => {
      // Validate employee is active
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) {
        throw new Error("Zaposlenik nije pronađen");
      }
      if (!employee.active) {
        throw new Error("Zaposlenik mora biti aktivan");
      }

      // Check if already assigned
      const existingManager = managers.find(
        (m) => m.employeeId === employeeId && m.departmentId === departmentId
      );
      if (existingManager) {
        return existingManager; // Already assigned
      }

      const newId = managers.length > 0 ? Math.max(...managers.map((m) => m.id), 0) + 1 : 1;

      const newManager: Manager = {
        id: newId,
        departmentId,
        employeeId,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      };

      setManagers((prev) => [...prev, newManager]);
      return newManager;
    },
    [managers]
  );

  const assignGeneralManager = useCallback(
    (employeeId: number, employees: Employee[]): Manager => {
      // Validate employee is active
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) {
        throw new Error("Zaposlenik nije pronađen");
      }
      if (!employee.active) {
        throw new Error("Zaposlenik mora biti aktivan");
      }

      // Check if already assigned
      const existingManager = managers.find(
        (m) => m.employeeId === employeeId && m.departmentId === undefined
      );
      if (existingManager) {
        return existingManager; // Already assigned
      }

      const newId = managers.length > 0 ? Math.max(...managers.map((m) => m.id), 0) + 1 : 1;

      const newManager: Manager = {
        id: newId,
        departmentId: undefined, // null = General Manager
        employeeId,
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true,
      };

      setManagers((prev) => [...prev, newManager]);
      return newManager;
    },
    [managers]
  );

  const removeManager = useCallback((managerId: number) => {
    setManagers((prev) => prev.filter((m) => m.id !== managerId));
  }, []);

  return {
    managers,
    assignDepartmentManager,
    assignGeneralManager,
    removeManager,
  };
}

/**
 * Hook for managing holidays with state
 */
export function useMockHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    if (typeof window === "undefined") {
      return mockHolidays;
    }

    const stored = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((holiday: any) => ({
          ...holiday,
          date: new Date(holiday.date),
          createdAt: new Date(holiday.createdAt),
          updatedAt: new Date(holiday.updatedAt),
        }));
      } catch {
        return mockHolidays;
      }
    }
    return mockHolidays;
  });

  // Save to localStorage whenever holidays change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_HOLIDAYS, JSON.stringify(holidays));
    }
  }, [holidays]);

  const createHoliday = useCallback(
    (data: Omit<Holiday, "id" | "createdAt" | "updatedAt">) => {
      const newId = holidays.length > 0 ? Math.max(...holidays.map((h) => h.id), 0) + 1 : 1;

      const newHoliday: Holiday = {
        ...data,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setHolidays((prev) => [...prev, newHoliday]);
      return newHoliday;
    },
    [holidays]
  );

  const updateHoliday = useCallback(
    (id: number, data: Partial<Holiday>) => {
      // Validate: cannot edit past holidays if one-time
      const holiday = holidays.find((h) => h.id === id);
      if (holiday && !holiday.repeatYearly) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (holiday.date < today) {
          throw new Error("Ne možete uređivati jednokratne praznike iz prošlosti");
        }
      }

      setHolidays((prev) =>
        prev.map((h) =>
          h.id === id
            ? {
                ...h,
                ...data,
                updatedAt: new Date(),
              }
            : h
        )
      );
    },
    [holidays]
  );

  const deleteHoliday = useCallback((id: number) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return {
    holidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
}

