/**
 * POST /api/auth/signup
 * Creates a new user account and session. Sets the session cookie.
 */
import { json } from "@tanstack/react-start";
import {
  createSession,
  createSessionCookie,
  hashPassword,
} from "~/lib/auth";
import { sql } from "~/db";

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { email?: string; password?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, displayName } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }
  if (!displayName || typeof displayName !== "string" || !displayName.trim()) {
    return json({ error: "Display name is required" }, { status: 400 });
  }

  // Check if email already exists
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
  if (existing.length > 0) {
    return json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO users (email, password_hash, display_name)
    VALUES (${normalizedEmail}, ${passwordHash}, ${displayName.trim()})
    RETURNING id, email, display_name, role, avatar_url
  `;

  const user = rows[0] as {
    id: string;
    email: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  };

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
