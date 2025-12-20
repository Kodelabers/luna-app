// Enums
export enum UserRole {
  ADMIN = "ADMIN",
}

export enum ApplicationStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED_FIRST_LEVEL = "APPROVED_FIRST_LEVEL",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum LedgerEntryType {
  ALLOCATION = "ALLOCATION",
  USAGE = "USAGE",
  TRANSFER = "TRANSFER",
  CORRECTION = "CORRECTION",
}

export enum DayCode {
  MON = "MON",
  TUE = "TUE",
  WED = "WED",
  THU = "THU",
  FRI = "FRI",
  SAT = "SAT",
  SUN = "SUN",
}

export enum EmployeeStatus {
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  SELECTED_FOR_DUTY = "SELECTED_FOR_DUTY",
}

// Core Types
export interface Organisation {
  id: number;
  name: string;
  alias: string;
  logoUrl?: string;
  themeColor?: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface User {
  id: number;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface OrganisationUser {
  id: number;
  organisationId: number;
  userId: number;
  roles: UserRole[];
  joinedAt: Date;
  active: boolean;
}

export interface Department {
  id: number;
  organisationId: number;
  name: string;
  alias: string;
  description?: string;
  colorCode?: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface Employee {
  id: number;
  organisationId: number;
  departmentId: number;
  userId?: number;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Manager {
  id: number;
  departmentId?: number; // null = General Manager, not null = Department Manager
  employeeId: number;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface UnavailabilityReason {
  id: number;
  organisationId: number;
  name: string;
  colorCode?: string;
  needApproval: boolean;
  needSecondApproval: boolean;
  hasPlanning: boolean;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface Application {
  id: number;
  organisationId: number;
  departmentId: number;
  employeeId: number;
  unavailabilityReasonId: number;
  description?: string;
  startDate: Date;
  endDate: Date;
  requestedWorkdays?: number;
  status: ApplicationStatus;
  active: boolean;
  createdAt: Date;
  createdById: number;
  updatedAt: Date;
  lastUpdatedById?: number;
}

export interface UnavailabilityLedgerEntry {
  id: number;
  organisationId: number;
  employeeId: number;
  unavailabilityReasonId: number;
  year: number;
  changeDays: number;
  type: LedgerEntryType;
  applicationId?: number;
  note?: string;
  createdAt: Date;
  createdById?: number;
}

export interface Holiday {
  id: number;
  organisationId: number;
  name: string;
  date: Date;
  repeatYearly: boolean;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface DaySchedule {
  id: number;
  organisationId: number;
  employeeId: number;
  applicationId?: number;
  unavailabilityReasonId?: number;
  date: Date;
  dayCode: DayCode;
  isWeekend: boolean;
  isHoliday: boolean;
  status: EmployeeStatus;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Types with Relations
export interface EmployeeWithDepartment extends Employee {
  department: Department;
}

export interface ApplicationWithRelations extends Application {
  employee: Employee;
  unavailabilityReason: UnavailabilityReason;
  department: Department;
}

export interface ManagerWithEmployee extends Manager {
  employee: Employee;
  department?: Department;
}

// Mock Auth Types
export interface MockUser {
  id: number;
  employeeId: number;
  organisationId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "EMPLOYEE" | "DEPARTMENT_MANAGER" | "GENERAL_MANAGER" | "ADMIN";
  departmentId?: number; // Only for department managers and employees
}

export interface MockAuthContext {
  currentUser: MockUser | null;
  organisation: Organisation;
  switchRole: (userId: number) => void;
  logout: () => void;
}

// Utility Types
export interface VacationBalance {
  employeeId: number;
  unavailabilityReasonId: number;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}

export interface ValidationError {
  field?: string;
  message: string;
}

