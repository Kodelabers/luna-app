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

  // Upsert user by clerkId
  // Only update firstName, lastName, email - never touch active flag
  const user = await db.user.upsert({
    where: {
      clerkId: clerkUser.id,
    },
    create: {
      clerkId: clerkUser.id,
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      email,
    },
    update: {
      firstName: clerkUser.firstName ?? undefined,
      lastName: clerkUser.lastName ?? undefined,
      email,
    },
  });

  return user;
}

/**
 * Get the current authenticated user and ensure local User exists
 * This is the main entry point for server-side auth checks
 */
export async function getCurrentUser(): Promise<User> {
  const clerkUser = await getClerkUser();
  return ensureLocalUser(clerkUser);
}

