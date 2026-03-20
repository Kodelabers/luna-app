import { z } from "zod";

// Translation function type used by schema factories
type TFunc = (key: string) => string;

// Common validation patterns
export const ianaTimezoneSchema = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid IANA timezone" }
);

export const monthSchema = z.coerce.number().min(1).max(12);
export const yearSchema = z.coerce.number().min(2000).max(2100);

// Organisation schemas
export function organisationAliasSchema(t: TFunc) {
  return z
    .string()
    .min(2, t("aliasMinLength"))
    .max(50, t("aliasMaxLength"))
    .regex(
      /^[a-z0-9-]+$/,
      t("aliasFormat")
    );
}

// Department schemas
export function createDepartmentSchema(t: TFunc) {
  return z.object({
    name: z.string().min(2, t("nameMinLength")).max(100),
    alias: z
      .string()
      .min(2, t("aliasMinLength"))
      .max(50)
      .regex(/^[a-z0-9-]+$/, t("aliasFormat")),
    description: z.string().max(500).optional(),
    colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t("invalidColorFormat")).optional(),
  });
}

export type CreateDepartmentInput = z.infer<ReturnType<typeof createDepartmentSchema>>;

export function updateDepartmentSchema(t: TFunc) {
  return createDepartmentSchema(t).partial();
}

// Employee schemas
export function createEmployeeSchema(t: TFunc) {
  return z.object({
    firstName: z.string().min(1, t("firstNameRequired")).max(100),
    lastName: z.string().min(1, t("lastNameRequired")).max(100),
    email: z.string().email(t("invalidEmail")),
    title: z.string().max(100).optional(),
    departmentId: z.string().min(1, t("departmentRequired")),
  });
}

export type CreateEmployeeInput = z.infer<ReturnType<typeof createEmployeeSchema>>;

// Application (leave request) schemas
export function createApplicationSchema(t: TFunc) {
  return z.object({
    unavailabilityReasonId: z.string().min(1, t("reasonRequired")),
    startDateLocalISO: z.string().min(1, t("startDateRequired")),
    endDateLocalISO: z.string().min(1, t("endDateRequired")),
    description: z.string().max(1000).optional(),
    clientTimeZone: ianaTimezoneSchema,
    applicationId: z.string().min(1).optional(),
    employeeId: z.string().min(1).optional(), // For managers creating applications for others
  });
}

export function submitApplicationSchema(t: TFunc) {
  return z.object({
    applicationId: z.string().min(1, t("applicationIdRequired")),
    clientTimeZone: ianaTimezoneSchema,
  });
}

export function deleteApplicationSchema(t: TFunc) {
  return z.object({
    applicationId: z.string().min(1, t("applicationIdRequired")),
  });
}

// UnavailabilityReason schemas
export function createUnavailabilityReasonSchema(t: TFunc) {
  return z.object({
    name: z.string().min(2, t("nameMinLength")).max(100),
    colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t("invalidColorFormat")).optional(),
    needApproval: z.coerce.boolean().default(false),
    needSecondApproval: z.coerce.boolean().default(false),
    hasPlanning: z.coerce.boolean().default(false),
    sickLeave: z.coerce.boolean().default(false),
  });
}

export type CreateUnavailabilityReasonInput = z.infer<ReturnType<typeof createUnavailabilityReasonSchema>>;

// Holiday schemas
export function createHolidaySchema(t: TFunc) {
  return z.object({
    name: z.string().min(2, t("nameMinLength")).max(100),
    date: z.coerce.date(),
    repeatYearly: z.coerce.boolean().default(false),
  });
}

export type CreateHolidayInput = z.infer<ReturnType<typeof createHolidaySchema>>;

// Dashboard / Calendar schemas
export const calendarMonthSchema = z.object({
  month: monthSchema,
  year: yearSchema,
  clientTimeZone: ianaTimezoneSchema,
});

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Manager schemas
export function createManagerSchema(t: TFunc) {
  return z.object({
    employeeId: z.string().min(1, t("employeeRequired")),
    // null = general manager, string = department manager
    departmentId: z.preprocess(
      (val) => (val === null || val === undefined || val === "" ? null : val),
      z.union([z.string().min(1), z.null()])
    ).optional(),
  });
}

// Ledger entry schemas
export function createLedgerEntrySchema(t: TFunc) {
  return z.object({
    employeeId: z.string().min(1, t("employeeRequired")),
    unavailabilityReasonId: z.string().min(1, t("reasonRequired")),
    year: yearSchema,
    changeDays: z.coerce.number().int(t("daysMustBeInteger")),
    type: z.enum(["ALLOCATION", "USAGE", "TRANSFER", "CORRECTION"]),
    note: z.string().max(500).optional(),
  });
}

// Application decision schemas (DM/GM approval)
export function applicationDecisionSchema(t: TFunc) {
  return z
    .object({
      applicationId: z.string().min(1, t("applicationIdRequired")),
      decision: z.enum(["APPROVE", "REJECT"]),
      comment: z.string().max(1000).optional(),
      clientTimeZone: ianaTimezoneSchema,
      requestedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      requestedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })
    .refine(
      (data) => {
        if (data.requestedStartDate && data.requestedEndDate) {
          const start = new Date(data.requestedStartDate);
          const end = new Date(data.requestedEndDate);
          return start <= end;
        }
        return true;
      },
      {
        message: t("startBeforeEnd"),
        path: ["requestedEndDate"],
      }
    );
}

// Days balance schemas (UC-DAYS-04, UC-DAYS-05)
export function allocateDaysSchema(t: TFunc) {
  return z.object({
    employeeId: z.string().min(1, t("employeeRequired")),
    unavailabilityReasonId: z.string().min(1, t("reasonTypeRequired")),
    year: yearSchema,
    days: z.coerce.number().int(t("daysMustBeInteger")).min(1, t("daysMin")).max(50, t("daysMax")),
    clientTimeZone: ianaTimezoneSchema,
  });
}

export type AllocateDaysInput = z.infer<ReturnType<typeof allocateDaysSchema>>;

export function updateAllocationSchema(t: TFunc) {
  return z.object({
    employeeId: z.string().min(1, t("employeeRequired")),
    unavailabilityReasonId: z.string().min(1, t("reasonTypeRequired")),
    year: yearSchema,
    adjustmentType: z.enum(["INCREASE", "DECREASE"]),
    adjustmentDays: z.coerce.number().int(t("daysMustBeInteger")).min(1, t("daysMin")).max(50, t("daysMax")),
    clientTimeZone: ianaTimezoneSchema,
  });
}

export type UpdateAllocationInput = z.infer<ReturnType<typeof updateAllocationSchema>>;

// Planning schemas (UC-PLAN-01)
export function getPlanningDataSchema(t: TFunc) {
  return z
    .object({
      fromLocalISO: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, t("dateFormat")),
      toLocalISO: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, t("dateFormat")),
      clientTimeZone: ianaTimezoneSchema,
      departmentIds: z.array(z.string().min(1)).optional(),
    })
    .refine(
      (data) => {
        const from = new Date(data.fromLocalISO);
        const to = new Date(data.toLocalISO);
        return from <= to;
      },
      {
        message: t("startBeforeEnd"),
        path: ["toLocalISO"],
      }
    )
    .refine(
      (data) => {
        const from = new Date(data.fromLocalISO);
        const to = new Date(data.toLocalISO);
        const diffMonths =
          (to.getFullYear() - from.getFullYear()) * 12 +
          (to.getMonth() - from.getMonth());
        return diffMonths <= 12;
      },
      {
        message: t("maxDateRange"),
        path: ["toLocalISO"],
      }
    );
}

// SickLeave schemas
export function openSickLeaveSchema(t: TFunc) {
  return z.object({
    employeeId: z.string().min(1, t("employeeRequired")),
    unavailabilityReasonId: z.string().min(1, t("reasonRequired")),
    startDateLocalISO: z.string().min(1, t("startDateRequired")),
    clientTimeZone: ianaTimezoneSchema,
    note: z.string().max(1000).optional(),
  });
}

export function closeSickLeaveSchema(t: TFunc) {
  return z.object({
    sickLeaveId: z.string().min(1, t("sickLeaveIdRequired")),
    endDateLocalISO: z.string().min(1, t("endDateRequired")),
    clientTimeZone: ianaTimezoneSchema,
    note: z.string().max(1000).optional(),
    cancelRemainingDays: z.coerce.boolean().optional(),
  });
}

export function cancelSickLeaveSchema(t: TFunc) {
  return z.object({
    sickLeaveId: z.string().min(1, t("sickLeaveIdRequired")),
  });
}

// Member schemas
export function updateMemberRolesSchema(t: TFunc) {
  return z.object({
    memberId: z.string().min(1, t("memberIdRequired")),
    isAdmin: z.coerce.boolean(),
  });
}

export function inviteMemberSchema(t: TFunc) {
  return z.object({
    firstName: z.string().min(1, t("firstNameRequired")).max(100),
    lastName: z.string().min(1, t("lastNameRequired")).max(100),
    email: z.string().email(t("invalidEmail")),
    isAdmin: z.coerce.boolean().default(false),
    createEmployee: z.coerce.boolean().default(false),
    departmentId: z.string().optional(),
    title: z.string().max(100).optional(),
  });
}

export function linkEmployeeSchema(t: TFunc) {
  return z.object({
    memberId: z.string().min(1, t("memberIdRequired")),
    employeeId: z.string().min(1, t("employeeIdRequired")),
  });
}

export function createEmployeeForMemberSchema(t: TFunc) {
  return z.object({
    memberId: z.string().min(1, t("memberIdRequired")),
    departmentId: z.string().min(1, t("departmentRequired")),
    title: z.string().max(100).optional(),
  });
}

// Helper to parse FormData with Zod schema
export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
): z.infer<T> {
  const data = Object.fromEntries(formData.entries());
  return schema.parse(data);
}

// Helper to safely parse FormData and return result with errors
export function safeParseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string[]> } {
  const data = Object.fromEntries(formData.entries());
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}
