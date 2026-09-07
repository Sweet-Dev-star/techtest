import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveDatabaseFile() {
  const configured = process.env.DATABASE_FILE ?? path.join("data", "app.db");
  if (configured === ":memory:") return configured;
  return path.isAbsolute(configured) ? configured : path.join(root, configured);
}

/** Every environment-dependent value the app reads, resolved once. */
export const config = {
  root,
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "127.0.0.1",

  databaseFile: resolveDatabaseFile(),
  migrationsDir: path.join(root, "migrations"),
  publicDir: path.join(root, "public"),

  sessionCookie: "tm_session",
  sessionTtlMs: 14 * 24 * 60 * 60 * 1000,

  /** Rejected below this length. Problem 3 asks you for a real policy. */
  minPasswordLength: 10,
  /** Default and maximum page size for task queries. */
  defaultPageSize: 50,
  maxPageSize: 200,
  /** Request bodies larger than this are refused outright. */
  maxBodyBytes: 1024 * 1024,
};
