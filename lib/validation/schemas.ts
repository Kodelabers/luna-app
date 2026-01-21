import { z } from "zod";

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
export const organisationAliasSchema = z
  .string()
  .min(2, "Alias mora imati najmanje 2 znaka")
  .max(50, "Alias može imati najviše 50 znakova")
  .regex(
    /^[a-z0-9-]+$/,
    "Alias može sadržavati samo mala slova, brojeve i crtice"
  );

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Naziv mora imati najmanje 2 znaka").max(100),
  alias: z
    .string()
    .min(2, "Alias mora imati najmanje 2 znaka")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Alias može sadržavati samo mala slova, brojeve i crtice"),
  description: z.string().max(500).optional(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Neispravan format boje").optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// Employee schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "Ime je obavezno").max(100),
  lastName: z.string().min(1, "Prezime je obavezno").max(100),
  email: z.string().email("Neispravan email format"),
  title: z.string().max(100).optional(),
  departmentId: z.string().min(1, "Odjel je obavezan"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// Application (leave request) schemas
export const validateApplicationDraftSchema = z.object({
  unavailabilityReasonId: z.string().min(1, "Razlog je obavezan"),
  startDateLocalISO: z.string().min(1, "Datum početka je obavezan"),
  endDateLocalISO: z.string().min(1, "Datum završetka je obavezan"),
  clientTimeZone: ianaTimezoneSchema,
  editingApplicationId: z.string().min(1).optional(),
});

export const createApplicationSchema = z.object({
  unavailabilityReasonId: z.string().min(1, "Razlog je obavezan"),
  startDateLocalISO: z.string().min(1, "Datum početka je obavezan"),
  endDateLocalISO: z.string().min(1, "Datum završetka je obavezan"),
  description: z.string().max(1000).optional(),
  clientTimeZone: ianaTimezoneSchema,
  applicationId: z.string().min(1).optional(),
  employeeId: z.string().min(1).optional(), // For managers creating applications for others
});

export const submitApplicationSchema = z.object({
  applicationId: z.string().min(1, "ID zahtjeva je obavezan"),
  clientTimeZone: ianaTimezoneSchema,
});

export const deleteApplicationSchema = z.object({
  applicationId: z.string().min(1, "ID zahtjeva je obavezan"),
});

// UnavailabilityReason schemas
export const createUnavailabilityReasonSchema = z.object({
  name: z.string().min(2, "Naziv mora imati najmanje 2 znaka").max(100),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Neispravan format boje").optional(),
  needApproval: z.coerce.boolean().default(false),
  needSecondApproval: z.coerce.boolean().default(false),
  hasPlanning: z.coerce.boolean().default(false),
  sickLeave: z.coerce.boolean().default(false),
});

export const updateUnavailabilityReasonSchema = createUnavailabilityReasonSchema.partial();

// Holiday schemas
export const createHolidaySchema = z.object({
  name: z.string().min(2, "Naziv mora imati najmanje 2 znaka").max(100),
  date: z.coerce.date(),
  repeatYearly: z.coerce.boolean().default(false),
});

export const updateHolidaySchema = createHolidaySchema.partial();

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
export const createManagerSchema = z.object({
  employeeId: z.string().min(1, "Zaposlenik je obavezan"),
  // null = general manager, string = department manager
  departmentId: z.preprocess(
    (val) => (val === null || val === undefined || val === "" ? null : val),
    z.union([z.string().min(1), z.null()])
  ).optional(),
});

// Ledger entry schemas
export const createLedgerEntrySchema = z.object({
  employeeId: z.string().min(1, "Zaposlenik je obavezan"),
  unavailabilityReasonId: z.string().min(1, "Razlog je obavezan"),
  year: yearSchema,
  changeDays: z.coerce.number().int("Broj dana mora biti cijeli broj"),
  type: z.enum(["ALLOCATION", "USAGE", "TRANSFER", "CORRECTION"]),
  note: z.string().max(500).optional(),
});

// Application decision schemas (DM/GM approval)
export const applicationDecisionSchema = z.object({
  applicationId: z.string().min(1, "ID zahtjeva je obavezan"),
  decision: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().max(1000).optional(),
  clientTimeZone: ianaTimezoneSchema,
});

// Days balance schemas (UC-DAYS-04, UC-DAYS-05)
export const allocateDaysSchema = z.object({
  employeeId: z.string().min(1, "Zaposlenik je obavezan"),
  unavailabilityReasonId: z.string().min(1, "Vrsta odsutnosti je obavezna"),
  year: yearSchema,
  days: z.coerce.number().int("Broj dana mora biti cijeli broj").min(1, "Broj dana mora biti najmanje 1").max(50, "Broj dana može biti najviše 50"),
  clientTimeZone: ianaTimezoneSchema,
});

export const updateAllocationSchema = z.object({
  employeeId: z.string().min(1, "Zaposlenik je obavezan"),
  unavailabilityReasonId: z.string().min(1, "Vrsta odsutnosti je obavezna"),
  year: yearSchema,
  adjustmentType: z.enum(["INCREASE", "DECREASE"]),
  adjustmentDays: z.coerce.number().int("Broj dana mora biti cijeli broj").min(1, "Broj dana mora biti najmanje 1").max(50, "Broj dana može biti najviše 50"),
  clientTimeZone: ianaTimezoneSchema,
});

// Planning schemas (UC-PLAN-01)
export const getPlanningDataSchema = z
  .object({
    fromLocalISO: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum mora biti u formatu YYYY-MM-DD"),
    toLocalISO: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum mora biti u formatu YYYY-MM-DD"),
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
      message: "Datum početka mora biti prije ili jednak datumu završetka",
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
      message: "Raspon datuma ne smije biti veći od 12 mjeseci",
      path: ["toLocalISO"],
    }
  );

// SickLeave schemas
export const openSickLeaveSchema = z.object({
  employeeId: z.string().min(1, "Zaposlenik je obavezan"),
  unavailabilityReasonId: z.string().min(1, "Razlog je obavezan"),
  startDateLocalISO: z.string().min(1, "Datum početka je obavezan"),
  clientTimeZone: ianaTimezoneSchema,
  note: z.string().max(1000).optional(),
});

export const closeSickLeaveSchema = z.object({
  sickLeaveId: z.string().min(1, "ID bolovanja je obavezno"),
  endDateLocalISO: z.string().min(1, "Datum završetka je obavezan"),
  clientTimeZone: ianaTimezoneSchema,
  note: z.string().max(1000).optional(),
  cancelRemainingDays: z.coerce.boolean().optional(),
});

export const cancelSickLeaveSchema = z.object({
  sickLeaveId: z.string().min(1, "ID bolovanja je obavezno"),
});

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

