import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";
import { config } from "../config.js";

/**
 * Applies every unapplied file in migrations/, in filename order, each in its
 * own transaction, recording what ran in schema_migrations. Safe to run on
 * every boot — already-applied files are skipped.
 *
 * To add a migration, drop a new numbered .sql file in migrations/ and restart.
 * Never edit an applied file; write a new one, the way you would against a
 * database you cannot drop.
 */
export function runMigrations(db: Database.Database, log: (line: string) => void = () => {}): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM schema_migrations").all().map((row) => (row as { name: string }).name),
  );

  const files = fs
    .readdirSync(config.migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const pending = files.filter((name) => !applied.has(name));

  const record = db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)");

  for (const name of pending) {
    const sql = fs.readFileSync(path.join(config.migrationsDir, name), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      record.run(name, new Date().toISOString());
    });
    apply();
    log(`applied ${name}`);
  }

  return pending;
}

// `npm run migrate` — apply against the configured file database.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { getDb } = await import("./connection.js");
  const db = getDb();
  const pending = runMigrations(db, (line) => console.log(line));
  console.log(pending.length === 0 ? "database already up to date" : `${pending.length} migration(s) applied`);
}
