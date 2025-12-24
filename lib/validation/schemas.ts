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
  departmentId: z.coerce.number().positive("Odjel je obavezan"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// Application (leave request) schemas
export const validateApplicationDraftSchema = z.object({
  unavailabilityReasonId: z.coerce.number().positive("Razlog je obavezan"),
  startDateLocalISO: z.string().min(1, "Datum početka je obavezan"),
  endDateLocalISO: z.string().min(1, "Datum završetka je obavezan"),
  clientTimeZone: ianaTimezoneSchema,
  editingApplicationId: z.coerce.number().positive().optional(),
});

export const saveDraftApplicationSchema = z.object({
  unavailabilityReasonId: z.coerce.number().positive("Razlog je obavezan"),
  startDateLocalISO: z.string().min(1, "Datum početka je obavezan"),
  endDateLocalISO: z.string().min(1, "Datum završetka je obavezan"),
  description: z.string().max(1000).optional(),
  clientTimeZone: ianaTimezoneSchema,
  applicationId: z.coerce.number().positive().optional(),
});

export const submitApplicationSchema = z.object({
  applicationId: z.coerce.number().positive("ID zahtjeva je obavezan"),
  clientTimeZone: ianaTimezoneSchema,
});

export const deleteApplicationSchema = z.object({
  applicationId: z.coerce.number().positive("ID zahtjeva je obavezan"),
});

// UnavailabilityReason schemas
export const createUnavailabilityReasonSchema = z.object({
  name: z.string().min(2, "Naziv mora imati najmanje 2 znaka").max(100),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Neispravan format boje").optional(),
  needApproval: z.coerce.boolean().default(false),
  needSecondApproval: z.coerce.boolean().default(false),
  hasPlanning: z.coerce.boolean().default(false),
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
  cursor: z.coerce.number().optional(),
});

// Manager schemas
export const createManagerSchema = z.object({
  employeeId: z.coerce.number().positive("Zaposlenik je obavezan"),
  // null = general manager, number = department manager
  departmentId: z.preprocess(
    (val) => (val === null || val === undefined ? null : val),
    z.union([z.coerce.number().positive(), z.null()])
  ).optional(),
});

// Ledger entry schemas
export const createLedgerEntrySchema = z.object({
  employeeId: z.coerce.number().positive("Zaposlenik je obavezan"),
  unavailabilityReasonId: z.coerce.number().positive("Razlog je obavezan"),
  year: yearSchema,
  changeDays: z.coerce.number().int("Broj dana mora biti cijeli broj"),
  type: z.enum(["ALLOCATION", "USAGE", "TRANSFER", "CORRECTION"]),
  note: z.string().max(500).optional(),
});

// Application decision schemas (DM/GM approval)
export const applicationDecisionSchema = z.object({
  applicationId: z.coerce.number().positive("ID zahtjeva je obavezan"),
  decision: z.enum(["APPROVE", "REJECT"], {
    message: "Odluka mora biti APPROVE ili REJECT",
  }),
  comment: z.string().max(1000).optional(),
  clientTimeZone: ianaTimezoneSchema,
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

