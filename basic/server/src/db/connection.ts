import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";
import { runMigrations } from "./migrate.js";

export type Db = Database.Database;

let database: Db | null = null;

/**
 * Opens the SQLite database on first use and keeps one connection per process.
 * better-sqlite3 is synchronous, which keeps the repositories free of async
 * plumbing and makes transactions trivial to reason about.
 *
 * Swapping to Postgres means reimplementing this module and the repositories;
 * nothing above them constructs SQL.
 */
export function getDb(): Db {
  if (database) return database;

  if (config.databaseFile !== ":memory:") {
    fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
  }

  database = new Database(config.databaseFile);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");

  runMigrations(database);
  return database;
}

/** Tests call this to point the process at a throwaway in-memory database. */
export function useInMemoryDb(): Db {
  closeDb();
  database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runMigrations(database);
  return database;
}

export function closeDb(): void {
  if (!database) return;
  database.close();
  database = null;
}
