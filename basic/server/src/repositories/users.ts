import { randomUUID } from "node:crypto";
import { getDb } from "../db/connection.js";

export type UserRow = {
  id: string;
  username: string;
  username_lower: string;
  email: string;
  email_lower: string;
  password_hash: string;
  created_at: string;
};

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

const PUBLIC = "id, username, email, created_at";

export function createUser(input: { username: string; email: string; passwordHash: string }): UserRow {
  const now = new Date().toISOString();
  const user: UserRow = {
    id: randomUUID(),
    username: input.username,
    username_lower: input.username.toLowerCase(),
    email: input.email,
    email_lower: input.email.toLowerCase(),
    password_hash: input.passwordHash,
    created_at: now,
  };

  getDb()
    .prepare(
      `INSERT INTO users (id, username, username_lower, email, email_lower, password_hash, created_at)
       VALUES (@id, @username, @username_lower, @email, @email_lower, @password_hash, @created_at)`,
    )
    .run(user);

  return user;
}

export function findUserByEmail(email: string): UserRow | null {
  return (
    (getDb()
      .prepare("SELECT * FROM users WHERE email_lower = ?")
      .get(email.trim().toLowerCase()) as UserRow | undefined) ?? null
  );
}

export function findUserByUsername(username: string): UserRow | null {
  return (
    (getDb()
      .prepare("SELECT * FROM users WHERE username_lower = ?")
      .get(username.trim().toLowerCase()) as UserRow | undefined) ?? null
  );
}

export function findPublicUserById(id: string): PublicUser | null {
  return (
    (getDb().prepare(`SELECT ${PUBLIC} FROM users WHERE id = ?`).get(id) as PublicUser | undefined) ??
    null
  );
}

/** Never send password_hash to a client. */
export function toPublicUser(user: UserRow): PublicUser {
  return { id: user.id, username: user.username, email: user.email, created_at: user.created_at };
}
