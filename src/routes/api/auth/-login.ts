/**
 * POST /api/auth/login
 * Validates credentials and creates a session. Sets the session cookie.
 */
import { json } from "@tanstack/react-start";
import {
  createSession,
  createSessionCookie,
  verifyPassword,
} from "~/lib/auth";
import { sql } from "~/db";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }

  // Find user
  const normalizedEmail = email.toLowerCase().trim();
  const rows = await sql`
    SELECT id, email, password_hash, display_name, role, avatar_url
    FROM users
    WHERE email = ${normalizedEmail}
  `;

  if (rows.length === 0) {
    return json({ error: "Invalid email or password" }, { status: 401 });
  }

  const user = rows[0] as {
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  };

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Create session
  const token = await createSession(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sessionUser = {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    avatarUrl: user.avatar_url,
  };

  return json(
    { user: sessionUser },
    {
      headers: {
        "Set-Cookie": createSessionCookie(token, expiresAt),
      },
    },
  );
}
