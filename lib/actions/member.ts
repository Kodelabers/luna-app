"use server";

import { revalidatePath } from "next/cache";
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
    requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = updateMemberRolesSchema.safeParse({
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
      throw new NotFoundError("Korisnik nije pronađen");
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
        throw new ForbiddenError("Ne možete ukloniti zadnjeg administratora");
      }
    }

    // Update roles
    const newRoles = isAdmin ? ["ADMIN" as const] : [];

    await db.organisationUser.update({
      where: { id: memberId },
      data: { roles: newRoles },
    });

    revalidatePath(`/${organisationAlias}/administration/members`);
    return successState("Uloge korisnika su uspješno ažurirane");
  } catch (error) {
    return mapErrorToFormState(error);
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
    requireAdmin(ctx);

    // Find the member
    const member = await db.organisationUser.findFirst({
      where: {
        id: memberId,
        organisationId: ctx.organisationId,
        active: true,
      },
    });

    if (!member) {
      throw new NotFoundError("Korisnik nije pronađen");
    }

    // Cannot remove yourself
    if (member.userId === ctx.user.id) {
      throw new ForbiddenError("Ne možete ukloniti sami sebe");
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
        throw new ForbiddenError("Ne možete ukloniti zadnjeg administratora");
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
    return successState("Korisnik je uspješno uklonjen");
  } catch (error) {
    return mapErrorToFormState(error);
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
    requireAdmin(ctx);

    // Parse and validate form data
    const rawData = Object.fromEntries(formData.entries());
    const result = inviteMemberSchema.safeParse(rawData);

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
        throw new ConflictError("Korisnik s ovim emailom je već član organizacije");
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
        return successState("Korisnik je uspješno pozvan u organizaciju");
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
        return successState("Korisnik i zaposlenik su uspješno kreirani");
      }
    }

    revalidatePath(`/${organisationAlias}/administration/members`);
    return successState("Korisnik je uspješno pozvan u organizaciju");
  } catch (error) {
    return mapErrorToFormState(error);
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
    requireAdmin(ctx);

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
    requireAdmin(ctx);

    const employeeId = formData.get("employeeId") as string;

    // Validate
    const result = linkEmployeeSchema.safeParse({ memberId, employeeId });
    if (!result.success) {
      return {
        success: false,
        formError: "Neispravni podaci",
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
      throw new NotFoundError("Korisnik nije pronađen");
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
      throw new NotFoundError("Zaposlenik nije pronađen ili je već povezan");
    }

    // Link employee to user
    await db.employee.update({
      where: { id: employeeId },
      data: { userId: member.userId },
    });

    revalidatePath(`/${organisationAlias}/administration/members`);
    revalidatePath(`/${organisationAlias}/administration/employees`);
    return successState("Zaposlenik je uspješno povezan");
  } catch (error) {
    return mapErrorToFormState(error);
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
    requireAdmin(ctx);

    const departmentId = formData.get("departmentId") as string;
    const title = formData.get("title") as string;

    // Validate
    const result = createEmployeeForMemberSchema.safeParse({
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
      throw new NotFoundError("Korisnik nije pronađen");
    }

    // Check if user already has an employee in this organisation
    const existingEmployee = await db.employee.findFirst({
      where: {
        organisationId: ctx.organisationId,
        userId: member.userId,
        active: true,
      },
    });

    if (existingEmployee) {
      throw new ConflictError("Korisnik već ima povezanog zaposlenika");
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
      throw new NotFoundError("Odjel nije pronađen");
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
    return successState("Zaposlenik je uspješno kreiran i povezan");
  } catch (error) {
    return mapErrorToFormState(error);
  }
}
