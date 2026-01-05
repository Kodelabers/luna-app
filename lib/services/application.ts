import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import { ForbiddenError, NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import { applyApprovalEffects } from "./approval-effects";
import { eachDayOfInterval, getDay, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { ApplicationStatus } from "@prisma/client";

/**
 * Decision input for DM/GM
 */
export type DecisionInput = {
  applicationId: string;
  decision: "APPROVE" | "REJECT";
  comment?: string;
  clientTimeZone: string;
};

/**
 * DM decides on SUBMITTED application (UC-DASH-04, UC-APP-08)
 */
export async function decideAsDepartmentManager(
  ctx: TenantContext,
  input: DecisionInput
): Promise<void> {
  const { applicationId, decision, comment, clientTimeZone } = input;

  // 1. Fetch application with relations
  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      unavailabilityReason: true,
      employee: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundError("Zahtjev nije pronađen");
  }

  // 2. Check status
  if (application.status !== "SUBMITTED") {
    throw new ConflictError("Zahtjev nije u statusu koji čeka odobrenje");
  }

  // 3. Check DM access to department
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  const isDm = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      departmentId: application.departmentId,
      active: true,
    },
  });

  if (!isDm) {
    throw new ForbiddenError("Nemate pristup ovom odjelu");
  }

  // 4. Process decision
  if (decision === "REJECT") {
    // Comment is required for rejection
    if (!comment || comment.trim().length === 0) {
      throw new ValidationError({ comment: ["Komentar je obavezan kod odbijanja zahtjeva"] });
    }

    // Update status to REJECTED
    await db.application.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        lastUpdatedById: ctx.organisationUser.id,
      },
    });

    // Add comment
    await db.applicationComment.create({
      data: {
        applicationId,
        comment,
        createdById: ctx.organisationUser.id,
      },
    });

    // Add log
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId,
        type: "REJECTED_ON_FIRST_APPROVAL",
        createdById: ctx.organisationUser.id,
      },
    });
  } else {
    // APPROVE
    const needSecondApproval = application.unavailabilityReason.needSecondApproval;

    if (needSecondApproval) {
      // Move to APPROVED_FIRST_LEVEL (awaiting GM)
      await db.application.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED_FIRST_LEVEL",
          lastUpdatedById: ctx.organisationUser.id,
        },
      });

      // Add optional comment
      if (comment && comment.trim().length > 0) {
        await db.applicationComment.create({
          data: {
            applicationId,
            comment,
            createdById: ctx.organisationUser.id,
          },
        });
      }

      // Add log (first level approval)
      await db.applicationLog.create({
        data: {
          organisationId: ctx.organisationId,
          applicationId,
          type: "APPROVED",
          createdById: ctx.organisationUser.id,
        },
      });
    } else {
      // Final approval (no second level needed)
      await db.application.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          lastUpdatedById: ctx.organisationUser.id,
        },
      });

      // Add optional comment
      if (comment && comment.trim().length > 0) {
        await db.applicationComment.create({
          data: {
            applicationId,
            comment,
            createdById: ctx.organisationUser.id,
          },
        });
      }

      // Add log
      await db.applicationLog.create({
        data: {
          organisationId: ctx.organisationId,
          applicationId,
          type: "APPROVED",
          createdById: ctx.organisationUser.id,
        },
      });

      // Apply approval effects (DaySchedule + ledger)
      await applyApprovalEffects(ctx, application, clientTimeZone);
    }
  }
}

/**
 * GM decides on APPROVED_FIRST_LEVEL application (UC-DASH-05, UC-APP-09)
 */
export async function decideAsGeneralManager(
  ctx: TenantContext,
  input: DecisionInput
): Promise<void> {
  const { applicationId, decision, comment, clientTimeZone } = input;

  // 1. Fetch application with relations
  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      organisationId: ctx.organisationId,
      active: true,
    },
    include: {
      unavailabilityReason: true,
      employee: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!application) {
    throw new NotFoundError("Zahtjev nije pronađen");
  }

  // 2. Check GM role first
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  const isGm = await db.manager.findFirst({
    where: {
      employeeId: employee.id,
      departmentId: null, // GM has null departmentId
      active: true,
    },
  });

  if (!isGm) {
    throw new ForbiddenError("Nemate General Manager ulogu");
  }

  // 3. Check status - GM can approve both APPROVED_FIRST_LEVEL and SUBMITTED
  if (application.status !== "SUBMITTED" && application.status !== "APPROVED_FIRST_LEVEL") {
    throw new ConflictError("Zahtjev nije u statusu koji čeka odobrenje");
  }

  // 4. Process decision
  if (decision === "REJECT") {
    // Comment is required for rejection
    if (!comment || comment.trim().length === 0) {
      throw new ValidationError({ comment: ["Komentar je obavezan kod odbijanja zahtjeva"] });
    }

    // Update status to REJECTED
    await db.application.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        lastUpdatedById: ctx.organisationUser.id,
      },
    });

    // Add comment
    await db.applicationComment.create({
      data: {
        applicationId,
        comment,
        createdById: ctx.organisationUser.id,
      },
    });

    // Add log
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId,
        type: "REJECTED",
        createdById: ctx.organisationUser.id,
      },
    });
  } else {
    // APPROVE (final)
    await db.application.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        lastUpdatedById: ctx.organisationUser.id,
      },
    });

    // Add optional comment
    if (comment && comment.trim().length > 0) {
      await db.applicationComment.create({
        data: {
          applicationId,
          comment,
          createdById: ctx.organisationUser.id,
        },
      });
    }

    // Add log
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId,
        type: "APPROVED",
        createdById: ctx.organisationUser.id,
      },
    });

    // Apply approval effects (DaySchedule + ledger)
    await applyApprovalEffects(ctx, application, clientTimeZone);
  }
}

/**
 * Validation result for application draft (UC-APP-01)
 */
export type ValidationResult = {
  calendarDays: number;
  workdays: number;
  availableDays: number;
  isValid: boolean;
  fieldErrors?: Record<string, string[]>;
  blockingOverlaps?: Array<{
    applicationId: string;
    status: ApplicationStatus;
    startLocalISO: string;
    endLocalISO: string;
  }>;
  dayScheduleOverlaps?: Array<{
    dateLocalISO: string;
    previousReasonId?: string;
    previousHasPlanning?: boolean;
    previousApplicationId?: string;
  }>;
  warnings?: string[];
};

/**
 * Input for validating application draft
 */
export type ValidateApplicationInput = {
  unavailabilityReasonId: string;
  startDateLocalISO: string;
  endDateLocalISO: string;
  clientTimeZone: string;
  editingApplicationId?: string;
  employeeId?: string;
};

/**
 * Input for creating application
 */
export type CreateApplicationInput = {
  unavailabilityReasonId: string;
  startDateLocalISO: string;
  endDateLocalISO: string;
  description?: string;
  clientTimeZone: string;
  applicationId?: string;
  employeeId?: string;
};

/**
 * Input for submitting application
 */
export type SubmitApplicationInput = {
  applicationId: string;
  clientTimeZone: string;
};

/**
 * Validate application draft (UC-APP-01)
 */
export async function validateApplicationDraft(
  ctx: TenantContext,
  input: ValidateApplicationInput
): Promise<ValidationResult> {
  const { unavailabilityReasonId, startDateLocalISO, endDateLocalISO, clientTimeZone, editingApplicationId, employeeId } = input;

  // Get employee
  let employee;
  if (employeeId) {
    // Manager creating application for someone else
    employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });
  } else {
    // User creating application for themselves
    employee = await db.employee.findFirst({
      where: {
        organisationId: ctx.organisationId,
        userId: ctx.user.id,
        active: true,
      },
    });
  }

  if (!employee) {
    throw new ForbiddenError("Zaposlenik nije pronađen");
  }

  // Parse dates as local dates in the client's timezone
  // startDateLocalISO format: "YYYY-MM-DD"
  const [startYear, startMonth, startDay] = startDateLocalISO.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDateLocalISO.split("-").map(Number);

  // Create dates in local timezone (SOD for start, EOD for end)
  const startLocal = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0); // SOD
  const endLocal = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999); // EOD

  // Basic validation
  const fieldErrors: Record<string, string[]> = {};

  if (endLocal < startLocal) {
    fieldErrors.endDate = ["Datum završetka mora biti jednak ili kasniji od datuma početka"];
  }

  // Convert to UTC for DB queries
  // fromZonedTime treats the input date as if it's in the specified timezone
  const startUTC = fromZonedTime(startLocal, clientTimeZone);
  const endUTC = fromZonedTime(endLocal, clientTimeZone);

  // Get unavailability reason
  const reason = await db.unavailabilityReason.findFirst({
    where: {
      id: unavailabilityReasonId,
      organisationId: ctx.organisationId,
      active: true,
    },
  });

  if (!reason) {
    fieldErrors.unavailabilityReasonId = ["Razlog nije pronađen"];
    return {
      calendarDays: 0,
      workdays: 0,
      availableDays: 0,
      isValid: false,
      fieldErrors,
    };
  }

  // Get all days in range
  const daysInRange = eachDayOfInterval({ start: startUTC, end: endUTC });
  const calendarDays = daysInRange.length;

  // Fetch holidays
  const holidays = await db.holiday.findMany({
    where: {
      organisationId: ctx.organisationId,
      active: true,
      OR: [
        {
          repeatYearly: false,
          date: {
            gte: startUTC,
            lte: endUTC,
          },
        },
        {
          repeatYearly: true,
        },
      ],
    },
  });

  // Build holiday map
  const holidayDates = new Set<string>();
  for (const holiday of holidays) {
    const holidayLocal = toZonedTime(holiday.date, clientTimeZone);
    const month = holidayLocal.getMonth() + 1;
    const day = holidayLocal.getDate();

    if (holiday.repeatYearly) {
      holidayDates.add(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    } else {
      const year = holidayLocal.getFullYear();
      holidayDates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }

  // Calculate workdays
  let workdays = 0;
  for (const utcDay of daysInRange) {
    const dayLocal = toZonedTime(utcDay, clientTimeZone);
    const dayOfWeek = getDay(utcDay);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const month = dayLocal.getMonth() + 1;
    const day = dayLocal.getDate();
    const year = dayLocal.getFullYear();
    const yearlyKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const fullKey = `${year}-${yearlyKey}`;
    const isHoliday = holidayDates.has(yearlyKey) || holidayDates.has(fullKey);

    if (!isWeekend && !isHoliday) {
      workdays++;
    }
  }

  // Check if period includes at least one workday
  if (workdays === 0) {
    fieldErrors.endDate = fieldErrors.endDate || [];
    fieldErrors.endDate.push("Period mora uključivati barem jedan radni dan");
  }

  // Check for overlaps with active applications
  const blockingOverlaps: ValidationResult["blockingOverlaps"] = [];
  const activeApplications = await db.application.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: employee.id,
      active: true,
      status: {
        in: ["DRAFT", "SUBMITTED", "APPROVED_FIRST_LEVEL"],
      },
      id: editingApplicationId ? { not: editingApplicationId } : undefined,
      OR: [
        {
          startDate: { lte: endUTC },
          endDate: { gte: startUTC },
        },
      ],
    },
  });

  for (const app of activeApplications) {
    blockingOverlaps.push({
      applicationId: app.id,
      status: app.status,
      startLocalISO: toZonedTime(app.startDate, clientTimeZone).toISOString().split("T")[0],
      endLocalISO: toZonedTime(app.endDate, clientTimeZone).toISOString().split("T")[0],
    });
  }

  // Check for overlaps with DaySchedule
  const dayScheduleOverlaps: ValidationResult["dayScheduleOverlaps"] = [];
  const existingSchedules = await db.daySchedule.findMany({
    where: {
      organisationId: ctx.organisationId,
      employeeId: employee.id,
      date: {
        gte: startUTC,
        lte: endUTC,
      },
      active: true,
    },
    include: {
      unavailabilityReason: {
        select: {
          hasPlanning: true,
        },
      },
    },
  });

  for (const schedule of existingSchedules) {
    dayScheduleOverlaps.push({
      dateLocalISO: toZonedTime(schedule.date, clientTimeZone).toISOString().split("T")[0],
      previousReasonId: schedule.unavailabilityReasonId ?? undefined,
      previousHasPlanning: schedule.unavailabilityReason?.hasPlanning,
      previousApplicationId: schedule.applicationId ?? undefined,
    });
  }

  // Calculate available days if hasPlanning=true
  let availableDays = 0;
  const warnings: string[] = [];

  if (reason.hasPlanning) {
    const startLocal = toZonedTime(startUTC, clientTimeZone);
    const year = startLocal.getFullYear();

    // Get ledger balance for current year
    const ledgerEntries = await db.unavailabilityLedgerEntry.findMany({
      where: {
        organisationId: ctx.organisationId,
        employeeId: employee.id,
        unavailabilityReasonId,
        year,
      },
    });

    // Check if there's any allocation for this year
    const hasAllocation = ledgerEntries.some((entry) => entry.type === "ALLOCATION");
    
    if (hasAllocation) {
      // Use current year allocation
      availableDays = ledgerEntries.reduce((sum, entry) => sum + entry.changeDays, 0);
    } else {
      // Check previous year for remaining days
      const previousYear = year - 1;
      const previousYearEntries = await db.unavailabilityLedgerEntry.findMany({
        where: {
          organisationId: ctx.organisationId,
          employeeId: employee.id,
          unavailabilityReasonId,
          year: previousYear,
        },
      });

      availableDays = previousYearEntries.reduce((sum, entry) => sum + entry.changeDays, 0);
    }

    // Check if enough days available
    if (workdays > availableDays) {
      fieldErrors.endDate = fieldErrors.endDate || [];
      fieldErrors.endDate.push(
        `Nemate dovoljno dostupnih dana (${availableDays} dostupno, ${workdays} zatraženo)`
      );
    }
  }

  // Add warnings for DaySchedule overlaps
  if (dayScheduleOverlaps.length > 0) {
    warnings.push("Ovaj zahtjev će prepisati postojeći plan");
    
    const hasPlanningOverlaps = dayScheduleOverlaps.some((o) => o.previousHasPlanning);
    if (hasPlanningOverlaps) {
      warnings.push("Korekcija dana će se izvršiti nakon odobrenja");
    }
  }

  const isValid = Object.keys(fieldErrors).length === 0 && blockingOverlaps.length === 0;

  return {
    calendarDays,
    workdays,
    availableDays,
    isValid,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    blockingOverlaps: blockingOverlaps.length > 0 ? blockingOverlaps : undefined,
    dayScheduleOverlaps: dayScheduleOverlaps.length > 0 ? dayScheduleOverlaps : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Create application (UC-APP-02)
 * When a manager creates an application for another employee, it goes directly to SUBMITTED status.
 */
export async function createApplication(
  ctx: TenantContext,
  input: CreateApplicationInput
): Promise<{ applicationId: string; status: ApplicationStatus }> {
  const { unavailabilityReasonId, startDateLocalISO, endDateLocalISO, description, clientTimeZone, applicationId, employeeId } =
    input;

  // Get current user's employee record
  const currentUserEmployee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  // Get target employee (for whom the application is being created)
  let targetEmployee;
  if (employeeId) {
    // Manager creating application for someone else
    targetEmployee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });
  } else {
    // User creating application for themselves
    targetEmployee = currentUserEmployee;
  }

  if (!targetEmployee) {
    throw new ForbiddenError("Zaposlenik nije pronađen");
  }

  // Determine if manager is creating for someone else
  const isCreatingForOther = employeeId && currentUserEmployee && employeeId !== currentUserEmployee.id;

  // Validate first
  const validation = await validateApplicationDraft(ctx, {
    unavailabilityReasonId,
    startDateLocalISO,
    endDateLocalISO,
    clientTimeZone,
    editingApplicationId: applicationId,
    employeeId: targetEmployee.id,
  });

  if (!validation.isValid) {
    throw new ValidationError(validation.fieldErrors || {}, "Validacija nije prošla");
  }

  // Parse and convert dates
  // startDateLocalISO format: "YYYY-MM-DD"
  const [startYear, startMonth, startDay] = startDateLocalISO.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDateLocalISO.split("-").map(Number);

  // Create dates in local timezone (SOD for start, EOD for end)
  const startLocal = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0); // SOD
  const endLocal = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999); // EOD

  // Convert to UTC for DB
  const startUTC = fromZonedTime(startLocal, clientTimeZone);
  const endUTC = fromZonedTime(endLocal, clientTimeZone);

  if (applicationId) {
    // Update existing draft
    const existing = await db.application.findFirst({
      where: {
        id: applicationId,
        organisationId: ctx.organisationId,
        employeeId: targetEmployee.id,
        status: "DRAFT",
        active: true,
      },
    });

    if (!existing) {
      throw new NotFoundError("Nacrt nije pronađen ili nije dostupan za uređivanje");
    }

    const updated = await db.application.update({
      where: { id: applicationId },
      data: {
        unavailabilityReasonId,
        startDate: startUTC,
        endDate: endUTC,
        description,
        requestedWorkdays: validation.workdays,
        lastUpdatedById: ctx.organisationUser.id,
      },
    });

    return {
      applicationId: updated.id,
      status: updated.status,
    };
  } else {
    // Determine initial status
    // If manager is creating for someone else, go directly to SUBMITTED
    const initialStatus: ApplicationStatus = isCreatingForOther ? "SUBMITTED" : "DRAFT";

    // Create new application
    const created = await db.application.create({
      data: {
        organisationId: ctx.organisationId,
        employeeId: targetEmployee.id,
        departmentId: targetEmployee.departmentId,
        unavailabilityReasonId,
        startDate: startUTC,
        endDate: endUTC,
        description,
        requestedWorkdays: validation.workdays,
        status: initialStatus,
        createdById: ctx.organisationUser.id,
        active: true,
      },
    });

    // Add CREATED log
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId: created.id,
        type: "CREATED",
        createdById: ctx.organisationUser.id,
      },
    });

    // If auto-submitted, add REQUESTED log as well
    if (isCreatingForOther) {
      await db.applicationLog.create({
        data: {
          organisationId: ctx.organisationId,
          applicationId: created.id,
          type: "REQUESTED",
          createdById: ctx.organisationUser.id,
        },
      });
    }

    return {
      applicationId: created.id,
      status: created.status,
    };
  }
}

/**
 * Submit application (UC-APP-03)
 */
export async function submitApplication(
  ctx: TenantContext,
  input: SubmitApplicationInput
): Promise<{ status: ApplicationStatus }> {
  const { applicationId, clientTimeZone } = input;

  // Get employee
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  // Get application
  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      organisationId: ctx.organisationId,
      employeeId: employee.id,
      active: true,
    },
    include: {
      unavailabilityReason: true,
    },
  });

  if (!application) {
    throw new NotFoundError("Zahtjev nije pronađen");
  }

  if (application.status !== "DRAFT") {
    throw new ConflictError("Samo nacrte je moguće poslati na odobrenje");
  }

  // Re-validate
  const startLocal = toZonedTime(application.startDate, clientTimeZone);
  const endLocal = toZonedTime(application.endDate, clientTimeZone);

  const validation = await validateApplicationDraft(ctx, {
    unavailabilityReasonId: application.unavailabilityReasonId,
    startDateLocalISO: startLocal.toISOString().split("T")[0],
    endDateLocalISO: endLocal.toISOString().split("T")[0],
    clientTimeZone,
    editingApplicationId: applicationId,
  });

  if (!validation.isValid) {
    throw new ValidationError(validation.fieldErrors || {}, "Validacija nije prošla");
  }

  // Check if approval is needed
  if (application.unavailabilityReason.needApproval) {
    // Move to SUBMITTED
    await db.application.update({
      where: { id: applicationId },
      data: {
        status: "SUBMITTED",
        lastUpdatedById: ctx.organisationUser.id,
      },
    });

    // Add log
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId,
        type: "REQUESTED",
        createdById: ctx.organisationUser.id,
      },
    });

    return { status: "SUBMITTED" };
  } else {
    // Auto-approve (no approval needed)
    await db.application.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        lastUpdatedById: ctx.organisationUser.id,
      },
    });

    // Add log
    await db.applicationLog.create({
      data: {
        organisationId: ctx.organisationId,
        applicationId,
        type: "APPROVED",
        createdById: ctx.organisationUser.id,
      },
    });

    // Apply approval effects
    await applyApprovalEffects(ctx, application, clientTimeZone);

    return { status: "APPROVED" };
  }
}

/**
 * Delete draft application (UC-APP-04)
 */
export async function deleteDraftApplication(ctx: TenantContext, applicationId: string): Promise<void> {
  // Get employee
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  // Get application
  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      organisationId: ctx.organisationId,
      employeeId: employee.id,
      active: true,
    },
  });

  if (!application) {
    throw new NotFoundError("Zahtjev nije pronađen");
  }

  if (application.status !== "DRAFT") {
    throw new ConflictError("Samo nacrte je moguće obrisati");
  }

  // Soft delete
  await db.application.update({
    where: { id: applicationId },
    data: {
      active: false,
      lastUpdatedById: ctx.organisationUser.id,
    },
  });

  // Add log
  await db.applicationLog.create({
    data: {
      organisationId: ctx.organisationId,
      applicationId,
      type: "DELETED",
      createdById: ctx.organisationUser.id,
    },
  });
}

/**
 * List employee's own applications (UC-APP-05)
 */
export async function listMyApplications(
  ctx: TenantContext,
  filters?: {
    status?: ApplicationStatus;
    year?: number;
    reasonId?: string;
    clientTimeZone?: string;
  }
): Promise<
  Array<{
    applicationId: string;
    startLocalISO: string;
    endLocalISO: string;
    status: ApplicationStatus;
    reasonId: string;
    reasonName: string;
    workdays: number | null;
    description: string | null;
    createdAtISO: string;
  }>
> {
  // Get employee
  const employee = await db.employee.findFirst({
    where: {
      organisationId: ctx.organisationId,
      userId: ctx.user.id,
      active: true,
    },
  });

  if (!employee) {
    throw new ForbiddenError("Nemate Employee profil u ovoj organizaciji");
  }

  // Build where clause
  const where: any = {
    organisationId: ctx.organisationId,
    employeeId: employee.id,
    active: true,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.reasonId) {
    where.unavailabilityReasonId = filters.reasonId;
  }

  // Fetch applications
  const applications = await db.application.findMany({
    where,
    include: {
      unavailabilityReason: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Use provided clientTimeZone or default to Europe/Zagreb
  const clientTimeZone = filters?.clientTimeZone || "Europe/Zagreb";

  return applications.map((app) => {
    // Convert UTC dates from DB to local timezone
    const startLocal = toZonedTime(app.startDate, clientTimeZone);
    const endLocal = toZonedTime(app.endDate, clientTimeZone);
    
    // Format as YYYY-MM-DD (local date only, no time component)
    const startLocalISO = `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}`;
    const endLocalISO = `${endLocal.getFullYear()}-${String(endLocal.getMonth() + 1).padStart(2, '0')}-${String(endLocal.getDate()).padStart(2, '0')}`;
    
    return {
      applicationId: app.id,
      startLocalISO,
      endLocalISO,
      status: app.status,
      reasonId: app.unavailabilityReason.id,
      reasonName: app.unavailabilityReason.name,
      workdays: app.requestedWorkdays,
      description: app.description,
      createdAtISO: app.createdAt.toISOString(),
    };
  });
}

/**
 * List applications for a department (for DM/GM view)
 */
export async function listDepartmentApplications(
  ctx: TenantContext,
  departmentId: string,
  filters?: {
    status?: ApplicationStatus;
    reasonId?: string;
    clientTimeZone?: string;
  }
): Promise<
  Array<{
    applicationId: string;
    startLocalISO: string;
    endLocalISO: string;
    status: ApplicationStatus;
    reasonId: string;
    reasonName: string;
    workdays: number | null;
    description: string | null;
    createdAtISO: string;
    employeeId: string;
    employeeName: string;
  }>
> {
  // Build where clause
  const where: any = {
    organisationId: ctx.organisationId,
    departmentId,
    active: true,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.reasonId) {
    where.unavailabilityReasonId = filters.reasonId;
  }

  // Fetch applications
  const applications = await db.application.findMany({
    where,
    include: {
      unavailabilityReason: {
        select: {
          id: true,
          name: true,
        },
      },
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Use provided clientTimeZone or default to Europe/Zagreb
  const clientTimeZone = filters?.clientTimeZone || "Europe/Zagreb";

  return applications.map((app) => {
    // Convert UTC dates from DB to local timezone
    const startLocal = toZonedTime(app.startDate, clientTimeZone);
    const endLocal = toZonedTime(app.endDate, clientTimeZone);
    
    // Format as YYYY-MM-DD (local date only, no time component)
    const startLocalISO = `${startLocal.getFullYear()}-${String(startLocal.getMonth() + 1).padStart(2, '0')}-${String(startLocal.getDate()).padStart(2, '0')}`;
    const endLocalISO = `${endLocal.getFullYear()}-${String(endLocal.getMonth() + 1).padStart(2, '0')}-${String(endLocal.getDate()).padStart(2, '0')}`;
    
    return {
      applicationId: app.id,
      startLocalISO,
      endLocalISO,
      status: app.status,
      reasonId: app.unavailabilityReason.id,
      reasonName: app.unavailabilityReason.name,
      workdays: app.requestedWorkdays,
      description: app.description,
      createdAtISO: app.createdAt.toISOString(),
      employeeId: app.employee.id,
      employeeName: `${app.employee.firstName} ${app.employee.lastName}`,
    };
  });
}

