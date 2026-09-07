import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { config } from "../config.js";
import { getDb } from "./connection.js";

/**
 * Applies every unapplied file in migrations/, in filename order, each in its
 * own transaction. Safe to run on every boot — already-applied files are
 * skipped, so `npm start` never needs a separate migrate step.
 */
export function migrate({ log = () => {} } = {}) {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM schema_migrations").all().map((row) => row.name),
  );

  const files = fs
    .readdirSync(config.migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const pending = files.filter((name) => !applied.has(name));

  for (const name of pending) {
    const sql = fs.readFileSync(path.join(config.migrationsDir, name), "utf8");

    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
        name,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error });
    }

    log(`applied ${name}`);
  }

  return pending;
}

// `npm run migrate`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const applied = migrate({ log: (line) => console.log(line) });
  console.log(applied.length === 0 ? "database already up to date" : `${applied.length} migration(s) applied`);
}
