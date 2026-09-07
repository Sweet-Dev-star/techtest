import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";

let database = null;

/**
 * Opens the SQLite database on first use and keeps one connection for the
 * process. node:sqlite is synchronous, which suits a single-file database and
 * keeps the repositories free of async plumbing.
 */
export function getDb() {
  if (database) return database;

  if (config.databaseFile !== ":memory:") {
    fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
  }

  database = new DatabaseSync(config.databaseFile);
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  return database;
}

export function closeDb() {
  if (!database) return;
  database.close();
  database = null;
}

/**
 * Runs `fn` inside a transaction, rolling back if it throws.
 * Use it wherever a request writes more than one row.
 */
export function transaction(fn) {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
