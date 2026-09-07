import { createHash, randomBytes } from "node:crypto";
import { config } from "../../config.js";
import { getDb } from "../connection.js";

/**
 * Sessions are opaque random tokens. Only their SHA-256 is stored, so reading
 * the database does not give you a usable session.
 */

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + config.sessionTtlMs).toISOString();

  getDb()
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, now.toISOString(), expiresAt);

  return { token, expiresAt };
}

/** Returns the signed-in user, or null if the token is unknown or expired. */
export function findSessionUser(token, now = new Date()) {
  if (!token) return null;

  return (
    getDb()
      .prepare(
        `SELECT u.id, u.email, u.display_name, u.created_at
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(hashToken(token), now.toISOString()) ?? null
  );
}

export function deleteSession(token) {
  if (!token) return;
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}

/**
 * Problem 3 asks for "sign out everywhere" — this is the query it needs.
 */
export function deleteSessionsForUser(userId) {
  getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function deleteExpiredSessions(now = new Date()) {
  return getDb().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString()).changes;
}
