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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b2b7332b-7e97-456c-84b1-92faf4f81900',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clerk.ts:ensureLocalUser',message:'User upsert being called',data:{clerkId:clerkUser.id,email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

