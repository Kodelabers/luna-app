import {
  Organisation,
  Department,
  Employee,
  Manager,
  User,
  OrganisationUser,
  UnavailabilityReason,
  Holiday,
  Application,
  UnavailabilityLedgerEntry,
  ApplicationStatus,
  UserRole,
  LedgerEntryType,
  DaySchedule,
  DayCode,
  EmployeeStatus,
} from "@/lib/types";
import { generateDateRange, isWeekend } from "@/lib/utils/dates";
import { isHoliday } from "@/lib/utils/workdays";

// Organisation
export const mockOrganisation: Organisation = {
  id: 1,
  name: "Luna Tech d.o.o.",
  alias: "luna-tech",
  logoUrl: undefined,
  themeColor: "rose",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  active: true,
};

// Departments
export const mockDepartments: Department[] = [
  {
    id: 1,
    organisationId: 1,
    name: "IT Development",
    alias: "it-dev",
    description: "Software development team",
    colorCode: "#3b82f6",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 2,
    organisationId: 1,
    name: "Human Resources",
    alias: "hr",
    description: "HR and recruitment",
    colorCode: "#10b981",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 3,
    organisationId: 1,
    name: "Marketing",
    alias: "marketing",
    description: "Marketing and communications",
    colorCode: "#f59e0b",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
];

// Employees
export const mockEmployees: Employee[] = [
  // IT Development (1-8)
  {
    id: 1,
    organisationId: 1,
    departmentId: 1,
    userId: 1,
    title: "CTO",
    firstName: "Marko",
    lastName: "Horvat",
    email: "marko.horvat@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 2,
    organisationId: 1,
    departmentId: 1,
    userId: 2,
    title: "Senior Developer",
    firstName: "Ana",
    lastName: "Kovačić",
    email: "ana.kovacic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: 3,
    organisationId: 1,
    departmentId: 1,
    userId: 3,
    title: "Developer",
    firstName: "Petar",
    lastName: "Novak",
    email: "petar.novak@lunatech.hr",
    active: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: 4,
    organisationId: 1,
    departmentId: 1,
    userId: 4,
    title: "Developer",
    firstName: "Ivana",
    lastName: "Babić",
    email: "ivana.babic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: 5,
    organisationId: 1,
    departmentId: 1,
    userId: 5,
    title: "Junior Developer",
    firstName: "Luka",
    lastName: "Jurić",
    email: "luka.juric@lunatech.hr",
    active: true,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: 6,
    organisationId: 1,
    departmentId: 1,
    userId: 6,
    title: "UX Designer",
    firstName: "Maja",
    lastName: "Marić",
    email: "maja.maric@lunatech.hr",
    active: true,
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
  },
  {
    id: 7,
    organisationId: 1,
    departmentId: 1,
    userId: 7,
    title: "QA Engineer",
    firstName: "Tomislav",
    lastName: "Pavlović",
    email: "tomislav.pavlovic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-01"),
  },
  {
    id: 8,
    organisationId: 1,
    departmentId: 1,
    userId: 8,
    title: "DevOps Engineer",
    firstName: "Katarina",
    lastName: "Vuković",
    email: "katarina.vukovic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-04-15"),
    updatedAt: new Date("2024-04-15"),
  },
  // HR (9-12)
  {
    id: 9,
    organisationId: 1,
    departmentId: 2,
    userId: 9,
    title: "HR Manager",
    firstName: "Sandra",
    lastName: "Matić",
    email: "sandra.matic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 10,
    organisationId: 1,
    departmentId: 2,
    userId: 10,
    title: "HR Specialist",
    firstName: "Josip",
    lastName: "Knežević",
    email: "josip.knezevic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: 11,
    organisationId: 1,
    departmentId: 2,
    userId: 11,
    title: "Recruiter",
    firstName: "Nina",
    lastName: "Šimić",
    email: "nina.simic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: 12,
    organisationId: 1,
    departmentId: 2,
    userId: 12,
    title: "HR Assistant",
    firstName: "Dario",
    lastName: "Perić",
    email: "dario.peric@lunatech.hr",
    active: true,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  // Marketing (13-17)
  {
    id: 13,
    organisationId: 1,
    departmentId: 3,
    userId: 13,
    title: "Marketing Manager",
    firstName: "Mateja",
    lastName: "Đurić",
    email: "mateja.djuric@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: 14,
    organisationId: 1,
    departmentId: 3,
    userId: 14,
    title: "Content Creator",
    firstName: "Laura",
    lastName: "Blažević",
    email: "laura.blazevic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: 15,
    organisationId: 1,
    departmentId: 3,
    userId: 15,
    title: "Social Media Manager",
    firstName: "Filip",
    lastName: "Barišić",
    email: "filip.barisic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: 16,
    organisationId: 1,
    departmentId: 3,
    userId: 16,
    title: "Graphic Designer",
    firstName: "Helena",
    lastName: "Vidović",
    email: "helena.vidovic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: 17,
    organisationId: 1,
    departmentId: 3,
    userId: 17,
    title: "SEO Specialist",
    firstName: "Ivan",
    lastName: "Tomić",
    email: "ivan.tomic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  // General Manager
  {
    id: 18,
    organisationId: 1,
    departmentId: 1, // Belongs to IT but is General Manager
    userId: 18,
    title: "CEO",
    firstName: "Ante",
    lastName: "Petrović",
    email: "ante.petrovic@lunatech.hr",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Managers
export const mockManagers: Manager[] = [
  // Department Manager - IT
  {
    id: 1,
    departmentId: 1,
    employeeId: 1, // Marko Horvat
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  // Department Manager - HR
  {
    id: 2,
    departmentId: 2,
    employeeId: 9, // Sandra Matić
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  // Department Manager - Marketing
  {
    id: 3,
    departmentId: 3,
    employeeId: 13, // Mateja Đurić
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  // General Manager
  {
    id: 4,
    departmentId: undefined, // NULL = General Manager
    employeeId: 18, // Ante Petrović
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
];

// Unavailability Reasons
export const mockUnavailabilityReasons: UnavailabilityReason[] = [
  {
    id: 1,
    organisationId: 1,
    name: "Godišnji odmor",
    colorCode: "#10b981",
    needApproval: true,
    needSecondApproval: true,
    hasPlanning: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 2,
    organisationId: 1,
    name: "Bolovanje",
    colorCode: "#f59e0b",
    needApproval: false,
    needSecondApproval: false,
    hasPlanning: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 3,
    organisationId: 1,
    name: "Edukacija",
    colorCode: "#3b82f6",
    needApproval: true,
    needSecondApproval: true,
    hasPlanning: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 4,
    organisationId: 1,
    name: "Slobodni dan",
    colorCode: "#8b5cf6",
    needApproval: true,
    needSecondApproval: false,
    hasPlanning: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
];

// Holidays 2025
export const mockHolidays: Holiday[] = [
  {
    id: 1,
    organisationId: 1,
    name: "Nova godina",
    date: new Date("2025-01-01"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 2,
    organisationId: 1,
    name: "Bogojavljenje",
    date: new Date("2025-01-06"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 3,
    organisationId: 1,
    name: "Uskrs",
    date: new Date("2025-04-20"),
    repeatYearly: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 4,
    organisationId: 1,
    name: "Uskrsni ponedjeljak",
    date: new Date("2025-04-21"),
    repeatYearly: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 5,
    organisationId: 1,
    name: "Praznik rada",
    date: new Date("2025-05-01"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 6,
    organisationId: 1,
    name: "Tijelovo",
    date: new Date("2025-06-19"),
    repeatYearly: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 7,
    organisationId: 1,
    name: "Dan antifašističke borbe",
    date: new Date("2025-06-22"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 8,
    organisationId: 1,
    name: "Dan državnosti",
    date: new Date("2025-06-25"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 9,
    organisationId: 1,
    name: "Dan pobjede i domovinske zahvalnosti",
    date: new Date("2025-08-05"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 10,
    organisationId: 1,
    name: "Velika Gospa",
    date: new Date("2025-08-15"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 11,
    organisationId: 1,
    name: "Dan neovisnosti",
    date: new Date("2025-10-08"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 12,
    organisationId: 1,
    name: "Svi sveti",
    date: new Date("2025-11-01"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 13,
    organisationId: 1,
    name: "Badnjak",
    date: new Date("2025-12-24"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 14,
    organisationId: 1,
    name: "Božić",
    date: new Date("2025-12-25"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
  {
    id: 15,
    organisationId: 1,
    name: "Sveti Stjepan",
    date: new Date("2025-12-26"),
    repeatYearly: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    active: true,
  },
];

// Applications (cont. in next file due to length)
export const mockApplications: Application[] = [
  // Ana Kovačić - APPROVED
  {
    id: 1,
    organisationId: 1,
    departmentId: 1,
    employeeId: 2,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor - zimski",
    startDate: new Date("2025-01-13"),
    endDate: new Date("2025-01-17"),
    requestedWorkdays: 5,
    status: ApplicationStatus.APPROVED,
    active: true,
    createdAt: new Date("2024-12-01"),
    createdById: 2,
    updatedAt: new Date("2024-12-05"),
    lastUpdatedById: 1,
  },
  // Petar Novak - SUBMITTED
  {
    id: 2,
    organisationId: 1,
    departmentId: 1,
    employeeId: 3,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor - proljetni",
    startDate: new Date("2025-03-10"),
    endDate: new Date("2025-03-14"),
    requestedWorkdays: 5,
    status: ApplicationStatus.SUBMITTED,
    active: true,
    createdAt: new Date("2024-12-10"),
    createdById: 3,
    updatedAt: new Date("2024-12-10"),
  },
  // Ivana Babić - APPROVED_FIRST_LEVEL
  {
    id: 3,
    organisationId: 1,
    departmentId: 1,
    employeeId: 4,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor - ljetni",
    startDate: new Date("2025-07-01"),
    endDate: new Date("2025-07-11"),
    requestedWorkdays: 9,
    status: ApplicationStatus.APPROVED_FIRST_LEVEL,
    active: true,
    createdAt: new Date("2024-12-15"),
    createdById: 4,
    updatedAt: new Date("2024-12-18"),
    lastUpdatedById: 1,
  },
  // Luka Jurić - DRAFT
  {
    id: 4,
    organisationId: 1,
    departmentId: 1,
    employeeId: 5,
    unavailabilityReasonId: 1,
    description: "",
    startDate: new Date("2025-06-02"),
    endDate: new Date("2025-06-06"),
    requestedWorkdays: 5,
    status: ApplicationStatus.DRAFT,
    active: true,
    createdAt: new Date("2024-12-18"),
    createdById: 5,
    updatedAt: new Date("2024-12-18"),
  },
  // Maja Marić - APPROVED
  {
    id: 5,
    organisationId: 1,
    departmentId: 1,
    employeeId: 6,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor",
    startDate: new Date("2025-02-10"),
    endDate: new Date("2025-02-14"),
    requestedWorkdays: 5,
    status: ApplicationStatus.APPROVED,
    active: true,
    createdAt: new Date("2024-11-20"),
    createdById: 6,
    updatedAt: new Date("2024-11-25"),
    lastUpdatedById: 1,
  },
  // Sandra Matić (HR Manager) - SUBMITTED
  {
    id: 6,
    organisationId: 1,
    departmentId: 2,
    employeeId: 9,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor",
    startDate: new Date("2025-08-04"),
    endDate: new Date("2025-08-15"),
    requestedWorkdays: 10,
    status: ApplicationStatus.SUBMITTED,
    active: true,
    createdAt: new Date("2024-12-10"),
    createdById: 9,
    updatedAt: new Date("2024-12-10"),
  },
  // Josip Knežević - APPROVED
  {
    id: 7,
    organisationId: 1,
    departmentId: 2,
    employeeId: 10,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor - zimski",
    startDate: new Date("2025-01-20"),
    endDate: new Date("2025-01-24"),
    requestedWorkdays: 5,
    status: ApplicationStatus.APPROVED,
    active: true,
    createdAt: new Date("2024-11-15"),
    createdById: 10,
    updatedAt: new Date("2024-11-20"),
    lastUpdatedById: 9,
  },
  // Mateja Đurić (Marketing Manager) - APPROVED
  {
    id: 8,
    organisationId: 1,
    departmentId: 3,
    employeeId: 13,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor - proljetni",
    startDate: new Date("2025-05-12"),
    endDate: new Date("2025-05-16"),
    requestedWorkdays: 5,
    status: ApplicationStatus.APPROVED,
    active: true,
    createdAt: new Date("2024-12-01"),
    createdById: 13,
    updatedAt: new Date("2024-12-08"),
    lastUpdatedById: 18,
  },
  // Laura Blažević - SUBMITTED
  {
    id: 9,
    organisationId: 1,
    departmentId: 3,
    employeeId: 14,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor",
    startDate: new Date("2025-04-07"),
    endDate: new Date("2025-04-11"),
    requestedWorkdays: 5,
    status: ApplicationStatus.SUBMITTED,
    active: true,
    createdAt: new Date("2024-12-17"),
    createdById: 14,
    updatedAt: new Date("2024-12-17"),
  },
  // Filip Barišić - REJECTED
  {
    id: 10,
    organisationId: 1,
    departmentId: 3,
    employeeId: 15,
    unavailabilityReasonId: 1,
    description: "Godišnji odmor",
    startDate: new Date("2025-05-12"),
    endDate: new Date("2025-05-16"),
    requestedWorkdays: 5,
    status: ApplicationStatus.REJECTED,
    active: true,
    createdAt: new Date("2024-12-10"),
    createdById: 15,
    updatedAt: new Date("2024-12-12"),
    lastUpdatedById: 13,
  },
];

// Ledger Entries
export const mockLedgerEntries: UnavailabilityLedgerEntry[] = [
  // Ana Kovačić - Allocation 2025
  {
    id: 1,
    organisationId: 1,
    employeeId: 2,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: 20,
    type: LedgerEntryType.ALLOCATION,
    note: "Godišnja alokacija za 2025",
    createdAt: new Date("2024-12-01"),
    createdById: 1,
  },
  // Ana Kovačić - Usage (Application 1)
  {
    id: 2,
    organisationId: 1,
    employeeId: 2,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: -5,
    type: LedgerEntryType.USAGE,
    applicationId: 1,
    note: "Godišnji odmor 13.01-17.01.2025",
    createdAt: new Date("2024-12-05"),
    createdById: 1,
  },
  // Petar Novak - Allocation 2025
  {
    id: 3,
    organisationId: 1,
    employeeId: 3,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: 20,
    type: LedgerEntryType.ALLOCATION,
    note: "Godišnja alokacija za 2025",
    createdAt: new Date("2024-12-01"),
    createdById: 1,
  },
  // Ivana Babić - Allocation 2025
  {
    id: 4,
    organisationId: 1,
    employeeId: 4,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: 22,
    type: LedgerEntryType.ALLOCATION,
    note: "Godišnja alokacija za 2025",
    createdAt: new Date("2024-12-01"),
    createdById: 1,
  },
  // Luka Jurić - Allocation 2025
  {
    id: 5,
    organisationId: 1,
    employeeId: 5,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: 20,
    type: LedgerEntryType.ALLOCATION,
    note: "Godišnja alokacija za 2025",
    createdAt: new Date("2024-12-01"),
    createdById: 1,
  },
  // Maja Marić - Allocation + Usage
  {
    id: 6,
    organisationId: 1,
    employeeId: 6,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: 20,
    type: LedgerEntryType.ALLOCATION,
    note: "Godišnja alokacija za 2025",
    createdAt: new Date("2024-12-01"),
    createdById: 1,
  },
  {
    id: 7,
    organisationId: 1,
    employeeId: 6,
    unavailabilityReasonId: 1,
    year: 2025,
    changeDays: -5,
    type: LedgerEntryType.USAGE,
    applicationId: 5,
    note: "Godišnji odmor 10.02-14.02.2025",
    createdAt: new Date("2024-11-25"),
    createdById: 1,
  },
];

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
 * Generate DaySchedule entries for an APPROVED application
 */
function generateDayScheduleEntries(
  application: Application,
  startId: number
): DaySchedule[] {
  const entries: DaySchedule[] = [];
  const dates = generateDateRange(application.startDate, application.endDate);
  let currentId = startId;

  for (const date of dates) {
    const weekend = isWeekend(date);
    const holiday = isHoliday(date, mockHolidays);

    entries.push({
      id: currentId++,
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
      createdAt: new Date(application.updatedAt || application.createdAt),
      updatedAt: new Date(application.updatedAt || application.createdAt),
    });
  }

  return entries;
}

// DaySchedule - Only for APPROVED applications
// Generate DaySchedule entries for all APPROVED applications
export const mockDaySchedules: DaySchedule[] = (() => {
  const approvedApps = mockApplications.filter(
    (app) => app.status === ApplicationStatus.APPROVED && app.active
  );
  let idCounter = 1;
  const allEntries: DaySchedule[] = [];

  for (const app of approvedApps) {
    const entries = generateDayScheduleEntries(app, idCounter);
    allEntries.push(...entries);
    idCounter += entries.length;
  }

  return allEntries;
})();

