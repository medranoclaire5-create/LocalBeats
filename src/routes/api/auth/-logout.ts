/**
 * POST /api/auth/logout
 * Deletes the session and clears the cookie.
 */
import { json } from "@tanstack/react-start";
import { createClearSessionCookie, deleteSession, parseCookies } from "~/lib/auth";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const token = cookies["lb_session"];
    if (token) {
      await deleteSession(token);
    }
  }

  return json(
    { success: true },
    {
      headers: {
        "Set-Cookie": createClearSessionCookie(),
      },
    },
  );
}
