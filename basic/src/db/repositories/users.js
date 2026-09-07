import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

const COLUMNS = "id, email, email_normalised, password_hash, display_name, created_at";

export function createUser({ email, passwordHash, displayName }) {
  const db = getDb();
  const user = {
    id: randomUUID(),
    email,
    email_normalised: email.toLowerCase(),
    password_hash: passwordHash,
    display_name: displayName,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO users (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    user.id,
    user.email,
    user.email_normalised,
    user.password_hash,
    user.display_name,
    user.created_at,
  );

  return user;
}

export function findUserByEmail(email) {
  return (
    getDb()
      .prepare(`SELECT ${COLUMNS} FROM users WHERE email_normalised = ?`)
      .get(String(email).toLowerCase()) ?? null
  );
}

export function findUserById(id) {
  return getDb().prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id) ?? null;
}

/** Never send password_hash to a client. */
export function serialiseUser(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    created_at: user.created_at,
  };
}
