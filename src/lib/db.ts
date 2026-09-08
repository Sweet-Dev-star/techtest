import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Storage for candidate registrations.
 *
 * SQLite via node:sqlite — no dependency, real constraints, and the file is
 * inspectable with any SQLite client.
 *
 * ONE CAVEAT BEFORE YOU DEPLOY: serverless hosts (Vercel included) give each
 * request an ephemeral filesystem, so this file does not survive there. Every
 * query in the app goes through src/lib/users.ts, so moving to Postgres means
 * rewriting that one module, not hunting SQL through the codebase.
 */

const databaseFile =
  process.env.SITE_DATABASE_FILE ?? path.join(process.cwd(), "data", "site.db");

let database: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (database) return database;

  if (databaseFile !== ":memory:") {
    fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
  }

  database = new DatabaseSync(databaseFile);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  migrate(database);

  return database;
}

/**
 * Applied on first use. Additive only — adding a column later means another
 * `ALTER TABLE ... ADD COLUMN` here, never an edit to what already ran.
 */
function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                  TEXT PRIMARY KEY,
      username            TEXT NOT NULL,
      username_normalised TEXT NOT NULL UNIQUE,
      email               TEXT NOT NULL,
      email_normalised    TEXT NOT NULL UNIQUE,
      password_hash       TEXT NOT NULL,
      country             TEXT NOT NULL,
      age                 INTEGER NOT NULL,
      developer_type      TEXT NOT NULL,
      created_at          TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}
