import { db } from "@/lib/db";
import { TenantContext } from "@/lib/tenant/resolveTenantContext";
import { ApplicationStatus } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";

/**
 * Employee dashboard context (UC-DASH-01)
 */
export type EmployeeDashboardContext = {
	employee: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		departmentId: string;
	} | null;
	isGeneralManager: boolean;
	isDepartmentManager: boolean;
	managedDepartmentIds: string[];
};

/**
 * Get employee dashboard context for current user
 */
export async function getEmployeeDashboardContext(
	ctx: TenantContext,
): Promise<EmployeeDashboardContext> {
	// Get employee profile
	const employee = await db.employee.findFirst({
		where: {
			organisationId: ctx.organisationId,
			userId: ctx.user.id,
			active: true,
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			departmentId: true,
		},
	});

	if (!employee) {
		return {
			employee: null,
			isGeneralManager: false,
			isDepartmentManager: false,
			managedDepartmentIds: [],
		};
	}

	// Get manager status
	const managers = await db.manager.findMany({
		where: {
			employeeId: employee.id,
			active: true,
		},
		select: {
			departmentId: true,
		},
	});

	const isGeneralManager = managers.some((m) => m.departmentId === null);
	const managedDepartmentIds = managers
		.filter((m) => m.departmentId !== null)
		.map((m) => m.departmentId!);

	return {
		employee,
		isGeneralManager,
		isDepartmentManager: managedDepartmentIds.length > 0,
		managedDepartmentIds,
	};
}

/**
 * Application summary for dashboard lists
 */
export type ApplicationSummary = {
	id: string;
	employeeId: string;
	employeeName: string;
	departmentId: string;
	departmentName: string;
	unavailabilityReasonId: string;
	unavailabilityReasonName: string;
	unavailabilityReasonColor: string | null;
	startDate: string; // ISO string for serialization
	endDate: string; // ISO string for serialization
	status: ApplicationStatus;
	description: string | null;
	requestedWorkdays: number | null;
	createdAt: string; // ISO string for serialization
};

type ApplicationWithRelations = {
	id: string;
	employeeId: string;
	departmentId: string;
	unavailabilityReasonId: string;
	startDate: Date;
	endDate: Date;
	status: ApplicationStatus;
	description: string | null;
	requestedWorkdays: number | null;
	createdAt: Date;
	employee: { firstName: string; lastName: string };
	department: { name: string };
	unavailabilityReason: { name: string; colorCode: string | null };
};

function mapToSummary(app: ApplicationWithRelations): ApplicationSummary {
	return {
		id: app.id,
		employeeId: app.employeeId,
		employeeName: `${app.employee.firstName} ${app.employee.lastName}`,
		departmentId: app.departmentId,
		departmentName: app.department.name,
		unavailabilityReasonId: app.unavailabilityReasonId,
		unavailabilityReasonName: app.unavailabilityReason.name,
		unavailabilityReasonColor: app.unavailabilityReason.colorCode,
		startDate: app.startDate.toISOString(),
		endDate: app.endDate.toISOString(),
		status: app.status,
		description: app.description,
		requestedWorkdays: app.requestedWorkdays,
		createdAt: app.createdAt.toISOString(),
	};
}

/**
 * Get open applications for employee (UC-DASH-03.1)
 * "Open" = DRAFT, SUBMITTED, APPROVED_FIRST_LEVEL, or APPROVED with endDate >= today
 */
export async function getOpenApplicationsForEmployee(
	ctx: TenantContext,
	employeeId: string,
	clientTimeZone: string,
): Promise<ApplicationSummary[]> {
	const now = new Date();
	const startOfTodayUtc = fromZonedTime(
		new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
		clientTimeZone,
	);

	const applications = await db.application.findMany({
		where: {
			organisationId: ctx.organisationId,
			employeeId,
			active: true,
			OR: [
				{ status: { in: ["DRAFT", "SUBMITTED", "APPROVED_FIRST_LEVEL"] } },
				{ status: { in: ["APPROVED", "REJECTED"] }, endDate: { gte: startOfTodayUtc } },
			],
		},
		include: {
			employee: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			department: {
				select: {
					name: true,
				},
			},
			unavailabilityReason: {
				select: {
					name: true,
					colorCode: true,
				},
			},
		},
	});

	const STATUS_PRIORITY: Record<string, number> = {
		REJECTED: 0,
		APPROVED: 1,
		APPROVED_FIRST_LEVEL: 2,
		SUBMITTED: 3,
		DRAFT: 4,
	};

	applications.sort((a, b) => {
		const priorityDiff =
			(STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
		if (priorityDiff !== 0) return priorityDiff;
		return a.startDate.getTime() - b.startDate.getTime();
	});

	return applications.map(mapToSummary);
}

/**
 * DM approval queues (UC-DASH-03.2)
 */
export type DmApprovalQueues = {
	submitted: ApplicationSummary[]; // Awaiting 1st level approval
	awaitingGm: ApplicationSummary[]; // Approved 1st level, awaiting GM
};

/**
 * Get DM approval queues for managed departments
 */
export async function getDmApprovalQueues(
	ctx: TenantContext,
	managedDepartmentIds: string[],
): Promise<DmApprovalQueues> {
	if (managedDepartmentIds.length === 0) {
		return { submitted: [], awaitingGm: [] };
	}

	// SUBMITTED applications in managed departments
	const submitted = await db.application.findMany({
		where: {
			organisationId: ctx.organisationId,
			departmentId: { in: managedDepartmentIds },
			status: "SUBMITTED",
			active: true,
		},
		include: {
			employee: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			department: {
				select: {
					name: true,
				},
			},
			unavailabilityReason: {
				select: {
					name: true,
					colorCode: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	// APPROVED_FIRST_LEVEL applications in managed departments
	const awaitingGm = await db.application.findMany({
		where: {
			organisationId: ctx.organisationId,
			departmentId: { in: managedDepartmentIds },
			status: "APPROVED_FIRST_LEVEL",
			active: true,
		},
		include: {
			employee: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			department: {
				select: {
					name: true,
				},
			},
			unavailabilityReason: {
				select: {
					name: true,
					colorCode: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return {
		submitted: submitted.map(mapToSummary),
		awaitingGm: awaitingGm.map(mapToSummary),
	};
}

/**
 * Get GM approval queue (UC-DASH-03.3)
 * All APPROVED_FIRST_LEVEL applications in the organisation
 */
export async function getGmApprovalQueue(
	ctx: TenantContext,
): Promise<ApplicationSummary[]> {
	const applications = await db.application.findMany({
		where: {
			organisationId: ctx.organisationId,
			status: "APPROVED_FIRST_LEVEL",
			active: true,
		},
		include: {
			employee: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			department: {
				select: {
					name: true,
				},
			},
			unavailabilityReason: {
				select: {
					name: true,
					colorCode: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return applications.map(mapToSummary);
}
