import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Supported locales
const locales = ["hr", "en"] as const;
const defaultLocale = "hr";
const LOCALE_COOKIE = "NEXT_LOCALE";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const response = NextResponse.next();

  // Set locale cookie if not present (detect from Accept-Language header)
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!localeCookie) {
    const acceptLanguage = request.headers.get("Accept-Language") || "";
    const preferredLocale = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang as typeof locales[number]));

    const locale = preferredLocale || defaultLocale;
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  // Allow public routes without authentication
  if (isPublicRoute(request)) {
    return response;
  }

  // Protect all other routes - require authentication
  await auth.protect();
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

