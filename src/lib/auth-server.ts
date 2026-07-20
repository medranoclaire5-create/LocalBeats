/**
 * Server-side auth for route loaders and server functions.
 * 
 * getCurrentUser: Returns the current user from the session cookie.
 * SessionUser: Type for the authenticated user object.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/start-server-core";
import { getUserFromCookieHeader, type SessionUser } from "./auth";

export type { SessionUser };

/**
 * Server function that returns the currently authenticated user, or null.
 * Uses getRequest() to access the incoming request's cookie header.
 */
export const getCurrentUser = createServerFn({ method: "GET" })
  .handler(async (): Promise<SessionUser | null> => {
    const request = getRequest();
    const cookieHeader = request.headers.get("cookie");
    return getUserFromCookieHeader(cookieHeader);
  });
