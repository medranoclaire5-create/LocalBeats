/**
 * Authentication utilities for LocalBeat.
 *
 * - Password hashing with Bun.password (bcrypt)
 * - Session management (token stored in HTTP-only cookie "lb_session")
 * - User lookup from session
 *
 * All functions are server-only — never import these in client code.
 */
import { sql } from "~/db";

// ---- Password utilities ----

export async function hashPassword(plaintext: string): Promise<string> {
  return Bun.password.hash(plaintext);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return Bun.password.verify(plaintext, hash);
}

// ---- Session types ----

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

// ---- Session management ----

const SESSION_COOKIE = "lb_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function createSessionCookie(token: string, expiresAt: Date): string {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function createClearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/**
 * Create a new session for a user, returning the token.
 */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `;

  return token;
}

/**
 * Look up a session by token. Returns null if not found or expired.
 */
export async function getSessionByToken(
  token: string,
): Promise<Session | null> {
  const rows = await sql`
    SELECT id, user_id, token, expires_at
    FROM sessions
    WHERE token = ${token} AND expires_at > now()
  `;

  if (rows.length === 0) return null;

  const row = rows[0] as {
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
  };

  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: String(row.expires_at),
  };
}

/**
 * Delete a session by token (for logout).
 */
export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

// ---- Cookie parsing ----

/**
 * Parse cookies from a Cookie header string into a plain object.
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookies[key] = val;
    }
  });
  return cookies;
}

/**
 * Get the current user from the request's session cookie.
 * Call this inside server functions or API routes.
 * Returns null if not authenticated.
 */
export async function getUserFromCookieHeader(
  cookieHeader: string | null,
): Promise<SessionUser | null> {
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  const rows = await sql`
    SELECT id, email, display_name, role, avatar_url
    FROM users
    WHERE id = ${session.userId}
  `;

  if (rows.length === 0) return null;

  const user = rows[0] as {
    id: string;
    email: string;
    display_name: string;
    role: string;
    avatar_url: string | null;
  };

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    avatarUrl: user.avatar_url,
  };
}
