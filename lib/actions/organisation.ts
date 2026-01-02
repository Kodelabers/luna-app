"use server";

import { revalidatePath } from "next/cache";
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
      throw new NotFoundError("Zaposlenik nije pronađen");
    }

    // Security: Verify email matches
    if (employee.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenError("Email adresa ne odgovara");
    }

    // Verify employee is not already linked to a user
    if (employee.userId !== null) {
      throw new ConflictError("Zaposlenik je već povezan s korisnikom");
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
      throw new ConflictError("Već ste član ove organizacije");
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

    return successState(`Uspješno ste se pridružili organizaciji ${employee.organisation.name}`);
  } catch (error) {
    return mapErrorToFormState(error);
  }
}

