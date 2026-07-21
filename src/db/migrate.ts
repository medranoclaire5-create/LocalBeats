/**
 * Database migration runner.
 * Run with: bun run src/db/migrate.ts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

async function migrate() {
  // Ensure migrations tracking table exists
  await sql`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, executed_at TIMESTAMPTZ NOT NULL DEFAULT now())`;

  // Get already-executed migrations
  const done = await sql`SELECT name FROM migrations ORDER BY id`;
  const doneNames = new Set(done.map((r: { name: string }) => r.name));

  const migrationsDir = join(import.meta.dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (doneNames.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }

    console.log(`  → ${file} ...`);
    const content = readFileSync(join(migrationsDir, file), "utf8");

    // Split into individual statements. The neon HTTP driver doesn't allow
    // multiple commands in a single query, so we split on semicolons.
    // Standalone SQL comments (lines starting with --) are harmless no-ops.
    const statements = content
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await sql.query(stmt);
    }

    await sql`INSERT INTO migrations (name) VALUES (${file})`;
    console.log(`  ✓ ${file} done`);
  }

  console.log("Migrations complete.");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
