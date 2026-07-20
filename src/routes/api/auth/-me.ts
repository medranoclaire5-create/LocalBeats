/**
 * GET /api/auth/me
 * Returns the current user from the session cookie, or null if not authenticated.
 */
import { json } from "@tanstack/react-start";
import { getUserFromCookieHeader } from "~/lib/auth";

export async function action({ request }: { request: Request }) {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await getUserFromCookieHeader(request.headers.get("cookie"));
  return json({ user });
}
