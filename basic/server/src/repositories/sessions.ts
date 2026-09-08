import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { getDb } from "../db/connection.js";
import { findPublicUserById, type PublicUser } from "./users.js";

/**
 * Sessions are opaque random tokens. Only their SHA-256 is stored, so reading
 * the database does not yield a usable session.
 */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: string, now: Date = new Date()): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + config.sessionTtlMs).toISOString();

  getDb()
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, now.toISOString(), expiresAt);

  return { token, expiresAt };
}

/** The signed-in user, or null if the token is unknown or expired. */
export function findSessionUser(token: string | undefined, now: Date = new Date()): PublicUser | null {
  if (!token) return null;

  const row = getDb()
    .prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?")
    .get(hashToken(token), now.toISOString()) as { user_id: string } | undefined;

  return row ? findPublicUserById(row.user_id) : null;
}

export function deleteSession(token: string | undefined): void {
  if (!token) return;
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

/** For "sign out everywhere" — the query the access-control work will need. */
export function deleteSessionsForUser(userId: string): void {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function deleteExpiredSessions(now: Date = new Date()): number {
  return getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString()).changes;
}
