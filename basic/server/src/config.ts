import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveDatabaseFile(): string {
  const configured = process.env.DATABASE_FILE ?? path.join("data", "app.db");
  if (configured === ":memory:") return configured;
  return path.isAbsolute(configured) ? configured : path.join(serverRoot, configured);
}

/** Every environment-dependent value the server reads, resolved once. */
export const config = {
  serverRoot,
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "127.0.0.1",
  nodeEnv: process.env.NODE_ENV ?? "development",

  databaseFile: resolveDatabaseFile(),
  migrationsDir: path.join(serverRoot, "src", "db", "migrations"),

  /** Where the built client is served from in production. */
  clientDist: path.resolve(serverRoot, "..", "client", "dist"),
  /** The client dev server, allowed through CORS in development. */
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",

  sessionCookie: "tm_session",
  sessionTtlMs: 14 * 24 * 60 * 60 * 1000,
  cookieSecure: process.env.COOKIE_SECURE === "true",

  /** Rejected below this length. The problems ask you for a real policy. */
  minPasswordLength: 10,
  defaultPageSize: 50,
  maxPageSize: 200,
  maxBodyBytes: 1024 * 1024,
} as const;

export const isProduction = config.nodeEnv === "production";
export const isTest = config.nodeEnv === "test";
