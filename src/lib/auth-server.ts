/**
 * Server-side auth for route loaders and server functions.
 * 
 * getCurrentUser: Returns the current user from the session cookie.
 * SessionUser: Type for the authenticated user object.
 */
import { createServerFn } from "@tanstack/react-start";
import { getUserFromCookieHeader, type SessionUser } from "./auth";

export type { SessionUser };

/**
 * Server function that returns the currently authenticated user, or null.
 * Called from route loaders and components.
 * 
 * NOTE: This currently returns null because getWebRequest is unavailable
 * in this version of TanStack Start. The Nav component handles auth display
 * via client-side fetch to /api/auth/me instead.
 * 
 * TODO: When TanStack Start exposes request access in server functions,
 * update this to read the session cookie from the incoming request.
 */
export const getCurrentUser = createServerFn({ method: "GET" })
  .handler(async (): Promise<SessionUser | null> => {
    // For now, return null — auth state is fetched client-side.
    // In a future version, we can read the cookie from the server context.
    return null;
  });
