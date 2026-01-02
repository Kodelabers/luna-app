import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";

/**
 * Get current Clerk user from server context
 * Throws if not authenticated
 */
export async function getClerkUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

/**
 * Ensure local User exists for the Clerk user
 * Creates or updates the User record based on clerkId
 * 
 * Per spec: "ne dirati active automatski" - we don't touch the active field
 */
export async function ensureLocalUser(clerkUser: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
}): Promise<User> {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User has no email address");
  }

  // Handle the case where:
  // 1. User exists by clerkId -> update
  // 2. User exists by email but different clerkId -> update clerkId (Clerk user was recreated)
  // 3. No user exists -> create
  // Only update firstName, lastName, email - never touch active flag
  const existingByClerkId = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingByClerkId) {
    // Case 1: User found by clerkId - update their info
    return db.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        email,
      },
    });
  }

  // Check if user exists by email (might have different clerkId)
  const existingByEmail = await db.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    // Case 2: User exists by email but with different clerkId
    // This happens when Clerk user was deleted and recreated
    // Update their clerkId to the new one
    return db.user.update({
      where: { email },
      data: {
        clerkId: clerkUser.id,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
      },
    });
  }

  // Case 3: New user - create
  return db.user.create({
    data: {
      clerkId: clerkUser.id,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      email,
    },
  });
}

/**
 * Get the current authenticated user and ensure local User exists
 * This is the main entry point for server-side auth checks
 */
export async function getCurrentUser(): Promise<User> {
  const clerkUser = await getClerkUser();
  return ensureLocalUser(clerkUser);
}

