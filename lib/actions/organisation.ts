"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/integrations/clerk";
import {
  FormState,
  mapErrorToFormState,
  successState,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "@/lib/errors";

/**
 * Join an organisation by linking to an existing Employee record
 * 
 * This is called when a user signs in and there's an Employee with their email
 * that hasn't been linked to any User yet.
 * 
 * Creates OrganisationUser and updates Employee.userId in a transaction.
 */
export async function joinOrganisation(employeeId: string): Promise<FormState> {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();

    // Find the employee and verify it matches the user's email
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        active: true,
      },
      include: {
        organisation: true,
      },
    });

    if (!employee) {
      const tErr = await getTranslations("errors");
      throw new NotFoundError(tErr("employeeNotFound"));
    }

    const tErr = await getTranslations("errors");

    // Security: Verify email matches
    if (employee.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenError(tErr("emailMismatch"));
    }

    // Verify employee is not already linked to a user
    if (employee.userId !== null) {
      throw new ConflictError(tErr("employeeAlreadyLinked"));
    }

    // Check if OrganisationUser already exists for this user+org
    const existingOrgUser = await db.organisationUser.findFirst({
      where: {
        userId: user.id,
        organisationId: employee.organisationId,
        active: true,
      },
    });

    if (existingOrgUser) {
      throw new ConflictError(tErr("alreadyMember"));
    }

    // Create OrganisationUser, link Employee, and update User name in a transaction
    await db.$transaction(async (tx) => {
      // Create OrganisationUser with no special roles
      await tx.organisationUser.create({
        data: {
          userId: user.id,
          organisationId: employee.organisationId,
          roles: [],
        },
      });

      // Link Employee to User
      await tx.employee.update({
        where: { id: employeeId },
        data: { userId: user.id },
      });

      // Update User's firstName and lastName from Employee data
      await tx.user.update({
        where: { id: user.id },
        data: {
          firstName: employee.firstName,
          lastName: employee.lastName,
        },
      });
    });

    // Revalidate the home page to reflect the new membership
    revalidatePath("/");

    const tLanding = await getTranslations("landing");
    return successState(tLanding("joinedOrganisation", { name: employee.organisation.name }));
  } catch (error) {
    return await mapErrorToFormState(error);
  }
}

