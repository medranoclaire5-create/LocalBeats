import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Server-only SQL functions backed by Neon serverless Postgres.
 *
 * Resolves DATABASE_URL from the environment (injected into the sandbox and
 * passed to the live host on publish).
 *
 * Use only inside `createServerFn()` handlers or API routes — never in client code.
 *
 * Tagged template (simple queries):
 *   const rows = await sql`SELECT id, title FROM events WHERE status = 'published'`;
 *
 * Parameterized (dynamic queries with placeholders $1, $2, ...):
 *   const rows = await sqlQuery("SELECT id FROM events WHERE event_type = $1", [type]);
 */

let _sql: NeonQueryFunction | null = null;

function getSql(): NeonQueryFunction {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set — connect a database before running queries.",
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

/**
 * Tagged-template SQL function.
 * Usage: await sql`SELECT * FROM users WHERE id = ${id}`
 */
export function sql(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<Record<string, unknown>[]> {
  return getSql()(strings, ...params) as Promise<Record<string, unknown>[]>;
}

/**
 * Parameterized SQL query using $1, $2, ... placeholders.
 * Usage: await sqlQuery("SELECT * FROM users WHERE id = $1", [id])
 */
export async function sqlQuery(
  query: string,
  params?: unknown[],
): Promise<Record<string, unknown>[]> {
  return getSql().query(query, params) as Promise<Record<string, unknown>[]>;
}
