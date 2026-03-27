"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { resolveTenantContext, requireAdmin } from "@/lib/tenant/resolveTenantContext";
import { updateMemberRolesSchema, inviteMemberSchema, linkEmployeeSchema, createEmployeeForMemberSchema } from "@/lib/validation/schemas";
import {
  FormState,
  mapErrorToFormState,
  successState,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "@/lib/errors";

/**
 * Update member roles (toggle ADMIN)
 */
export async function updateMemberRoles(
  organisationAlias: string,
  memberId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const tVal = await getTranslations("validation");
    const result = updateMemberRolesSchema(tVal).safeParse({
      ...rawData,
      memberId,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        fieldErrors,
      };
    }

    const { isAdmin } = result.data;

    // Find the member
    const member = await db.organisationUser.findFirst({
      where: {
        id: memberId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!member) {
      const tErr = await getTranslations("errors");
      throw new NotFoundError(tErr("userNotFound"));
    }

    // If removing admin role, check that at least one admin remains
    if (!isAdmin && member.roles.includes("ADMIN")) {
      const adminCount = await db.organisationUser.count({
        where: {
          organisationId: ctx.organisationId,
          active: true,
          roles: { has: "ADMIN" },
        },
      });

      if (adminCount <= 1) {
        const tMem = await getTranslations("members");
        throw new ForbiddenError(tMem("cannotRemoveLastAdmin"));
      }
    }

    // Update roles
    const newRoles = isAdmin ? ["ADMIN" as const] : [];

    await db.organisationUser.update({
      where: { id: memberId },
      data: { roles: newRoles },
    });

    revalidatePath(`/${organisationAlias}/administration/members`);
    const tMem = await getTranslations("members");
    return successState(tMem("messages.memberUpdated"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Remove member from organisation (soft delete)
 */
export async function removeMember(
  organisationAlias: string,
  memberId: string
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Find the member
    const member = await db.organisationUser.findFirst({
      where: {
        id: memberId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!member) {
      const tErr = await getTranslations("errors");
      throw new NotFoundError(tErr("userNotFound"));
    }

    const tMem = await getTranslations("members");

    // Cannot remove yourself
    if (member.userId === ctx.user.id) {
      throw new ForbiddenError(tMem("cannotRemoveSelf"));
    }

    // If member is admin, check that at least one admin remains
    if (member.roles.includes("ADMIN")) {
      const adminCount = await db.organisationUser.count({
        where: {
          organisationId: ctx.organisationId,
          active: true,
          roles: { has: "ADMIN" },
        },
      });

      if (adminCount <= 1) {
        throw new ForbiddenError(tMem("cannotRemoveLastAdmin"));
      }
    }

    // Soft delete OrganisationUser
    await db.organisationUser.update({
      where: { id: memberId },
      data: { active: false },
    });

    // Unlink any employees that were linked to this user in this organisation
    await db.employee.updateMany({
      where: {
        organisationId: ctx.organisationId,
        userId: member.userId,
      },
      data: { userId: null },
    });

    revalidatePath(`/${organisationAlias}/administration/members`);
    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState(tMem("messages.memberRemoved"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Invite a new member to the organisation
 * Creates User if doesn't exist, creates OrganisationUser
 */
export async function inviteMember(
  organisationAlias: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const tVal = await getTranslations("validation");
    const result = inviteMemberSchema(tVal).safeParse(rawData);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        fieldErrors,
      };
    }

    const { email, firstName, lastName, isAdmin } = result.data;
    const roles = isAdmin ? ["ADMIN" as const] : [];

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email },
    });

    // If user exists, check if already a member
    if (user) {
      const existingMember = await db.organisationUser.findFirst({
        where: {
          organisationId: ctx.organisationId,
          userId: user.id,
          active: true,
        },
      });

      if (existingMember) {
        const tMem = await getTranslations("members");
        throw new ConflictError(tMem("userAlreadyMember"));
      }

      // Check for inactive membership and reactivate
      const inactiveMember = await db.organisationUser.findFirst({
        where: {
          organisationId: ctx.organisationId,
          userId: user.id,
          active: false,
        },
      });

      if (inactiveMember) {
        // Update user data with new name if provided
        await db.user.update({
          where: { id: user.id },
          data: { firstName, lastName },
        });

        await db.organisationUser.update({
          where: { id: inactiveMember.id },
          data: { active: true, roles },
        });

        revalidatePath(`/${organisationAlias}/administration/members`);
        const tMem = await getTranslations("members");
        return successState(tMem("messages.inviteSent"));
      }
    }

    // If user doesn't exist, create a new user with provided data
    if (!user) {
      user = await db.user.create({
        data: {
          clerkId: `pending_${email}`, // Placeholder until Clerk signup
          email,
          firstName,
          lastName,
        },
      });
    }

    // Create organisation membership
    await db.organisationUser.create({
      data: {
        organisationId: ctx.organisationId,
        userId: user.id,
        roles,
      },
    });

    // Optionally create employee
    const createEmployee = formData.get("createEmployee") === "true";
    const departmentId = formData.get("departmentId") as string;
    const title = formData.get("title") as string;

    if (createEmployee && departmentId) {
      // Verify department exists
      const department = await db.department.findFirst({
        where: {
          id: departmentId,
          organisationId: ctx.organisationId,
          active: true,
        },
      });

      if (department) {
        await db.employee.create({
          data: {
            organisationId: ctx.organisationId,
            departmentId,
            firstName,
            lastName,
            email,
            title: title || null,
            userId: user.id,
          },
        });

        revalidatePath(`/${organisationAlias}/administration/employees`);
        revalidatePath(`/${organisationAlias}/administration/members`);
        const tMem = await getTranslations("members");
        return successState(tMem("messages.memberAndEmployeeCreated"));
      }
    }

    revalidatePath(`/${organisationAlias}/administration/members`);
    const tMem = await getTranslations("members");
    return successState(tMem("messages.inviteSent"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Search for unlinked employees (employees without userId)
 */
export async function searchUnlinkedEmployees(
  organisationAlias: string,
  query: string
): Promise<{ id: string; firstName: string; lastName: string; email: string; departmentName: string }[]> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    if (!query || query.length < 2) {
      return [];
    }

    const employees = await db.employee.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
        userId: null, // Only unlinked employees
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          ...(() => {
            const queryParts = query.trim().split(/\s+/);
            return queryParts.length >= 2
              ? [
                  {
                    AND: [
                      { firstName: { contains: queryParts.slice(0, -1).join(" "), mode: "insensitive" as const } },
                      { lastName: { contains: queryParts[queryParts.length - 1], mode: "insensitive" as const } },
                    ],
                  },
                  {
                    AND: [
                      { firstName: { contains: queryParts[0], mode: "insensitive" as const } },
                      { lastName: { contains: queryParts.slice(1).join(" "), mode: "insensitive" as const } },
                    ],
                  },
                ]
              : [];
          })(),
        ],
      },
      include: {
        department: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
      orderBy: [
        { firstName: "asc" },
        { lastName: "asc" },
      ],
    });

    return employees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      departmentName: emp.department.name,
    }));
  } catch (error) {
    console.error("Error searching unlinked employees:", error);
    return [];
  }
}

/**
 * Link an existing employee to a member (user)
 */
export async function linkEmployeeToMember(
  organisationAlias: string,
  memberId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    const employeeId = formData.get("employeeId") as string;

    // Validate
    const tVal = await getTranslations("validation");
    const result = linkEmployeeSchema(tVal).safeParse({ memberId, employeeId });
    if (!result.success) {
      const tErr = await getTranslations("errors");
      return {
        success: false,
        formError: tErr("invalidData"),
      };
    }

    const tErr = await getTranslations("errors");
    const tMem = await getTranslations("members");

    // Find the member
    const member = await db.organisationUser.findFirst({
      where: {
        id: memberId,
        organisationId: ctx.organisationId,
        active: true,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundError(tErr("userNotFound"));
    }

    // Find the employee
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        organisationId: ctx.organisationId,
        active: true,
        userId: null, // Must be unlinked
      },
    });

    if (!employee) {
      throw new NotFoundError(tMem("messages.employeeNotFoundOrLinked"));
    }

    // Link employee to user
    await db.employee.update({
      where: { id: employeeId },
      data: { userId: member.userId },
    });

    revalidatePath(`/${organisationAlias}/administration/members`);
    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState(tMem("messages.employeeLinked"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

/**
 * Create a new employee and link to a member (user)
 */
export async function createEmployeeForMember(
  organisationAlias: string,
  memberId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const ctx = await resolveTenantContext(organisationAlias);
    await requireAdmin(ctx);

    const departmentId = formData.get("departmentId") as string;
    const title = formData.get("title") as string;

    // Validate
    const tVal = await getTranslations("validation");
    const result = createEmployeeForMemberSchema(tVal).safeParse({
      memberId,
      departmentId,
      title,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      return {
        success: false,
        fieldErrors,
      };
    }

    // Find the member
    const member = await db.organisationUser.findFirst({
      where: {
        id: memberId,
        organisationId: ctx.organisationId,
        active: true,
      },
      include: {
        user: true,
      },
    });

    if (!member) {
      const tErr = await getTranslations("errors");
      throw new NotFoundError(tErr("userNotFound"));
    }

    const tMem = await getTranslations("members");
    const tMsg = await getTranslations("messages");

    // Check if user already has an employee in this organisation
    const existingEmployee = await db.employee.findFirst({
      where: {
        organisationId: ctx.organisationId,
        userId: member.userId,
        active: true,
      },
    });

    if (existingEmployee) {
      throw new ConflictError(tMem("messages.userAlreadyHasEmployee"));
    }

    // Verify department exists
    const department = await db.department.findFirst({
      where: {
        id: departmentId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!department) {
      throw new NotFoundError(tMsg("departmentNotFound"));
    }

    // Create employee linked to user
    await db.employee.create({
      data: {
        organisationId: ctx.organisationId,
        departmentId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        title: title || null,
        userId: member.userId,
      },
    });

    revalidatePath(`/${organisationAlias}/administration/members`);
    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState(tMem("messages.employeeCreated"));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}
