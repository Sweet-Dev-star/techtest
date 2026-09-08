import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import {
  isCountryCode,
  isDeveloperType,
  MAX_AGE,
  MIN_AGE,
  MIN_PASSWORD_LENGTH,
} from "@/lib/options";
import { hashPassword, verifyPassword } from "@/lib/passwords";

/**
 * Everything that reads or writes a registration. Swapping SQLite for a hosted
 * database means rewriting this file and src/lib/db.ts, and nothing else.
 */

export type User = {
  id: string;
  username: string;
  email: string;
  country: string;
  age: number;
  developer_type: string;
  created_at: string;
};

type UserRow = User & { password_hash: string };

const PUBLIC_COLUMNS = "id, username, email, country, age, developer_type, created_at";

/** Field name → message. An empty object means the input is good. */
export type FieldErrors = Record<string, string>;

export type RegistrationInput = {
  username: string;
  email: string;
  password: string;
  country: string;
  age: string;
  developerType: string;
};

const USERNAME = /^[a-zA-Z0-9._-]{3,32}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a registration. Returns every problem at once rather than the
 * first, so nobody has to submit five times to find five mistakes.
 */
export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};

  const username = input.username.trim();
  if (!username) errors.username = "Choose a username.";
  else if (!USERNAME.test(username)) {
    errors.username = "3–32 characters, using letters, numbers, dot, underscore or hyphen.";
  }

  const email = input.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL.test(email)) errors.email = "That does not look like an email address.";

  if (!input.password) errors.password = "Choose a password.";
  else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `At least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!input.country) errors.country = "Select your country.";
  else if (!isCountryCode(input.country)) errors.country = "Select a country from the list.";

  if (!input.age) errors.age = "Enter your age.";
  else {
    const age = Number(input.age);
    if (!Number.isInteger(age)) errors.age = "Age must be a whole number.";
    else if (age < MIN_AGE || age > MAX_AGE) errors.age = `Age must be between ${MIN_AGE} and ${MAX_AGE}.`;
  }

  if (!input.developerType) errors.developerType = "Select the role that fits you best.";
  else if (!isDeveloperType(input.developerType)) {
    errors.developerType = "Select a role from the list.";
  }

  return errors;
}

export function findUserByEmail(email: string): UserRow | null {
  return (
    (getDb()
      .prepare(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email_normalised = ?`)
      .get(email.trim().toLowerCase()) as UserRow | undefined) ?? null
  );
}

export function findUserByUsername(username: string): UserRow | null {
  return (
    (getDb()
      .prepare(`SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE username_normalised = ?`)
      .get(username.trim().toLowerCase()) as UserRow | undefined) ?? null
  );
}

export function findUserById(id: string): User | null {
  return (
    (getDb().prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(id) as
      | User
      | undefined) ?? null
  );
}

/**
 * Creates the account. Uniqueness is checked here for a friendly message and
 * enforced by the UNIQUE indexes underneath, which is what actually holds when
 * two people register the same name at the same moment.
 */
export function createUser(input: RegistrationInput): { user: User } | { errors: FieldErrors } {
  const username = input.username.trim();
  const email = input.email.trim();

  const errors: FieldErrors = {};
  if (findUserByUsername(username)) errors.username = "That username is taken.";
  if (findUserByEmail(email)) errors.email = "That email is already registered.";
  if (Object.keys(errors).length > 0) return { errors };

  const user: User = {
    id: randomUUID(),
    username,
    email,
    country: input.country,
    age: Number(input.age),
    developer_type: input.developerType,
    created_at: new Date().toISOString(),
  };

  try {
    getDb()
      .prepare(
        `INSERT INTO users
           (id, username, username_normalised, email, email_normalised,
            password_hash, country, age, developer_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        user.id,
        user.username,
        user.username.toLowerCase(),
        user.email,
        user.email.toLowerCase(),
        hashPassword(input.password),
        user.country,
        user.age,
        user.developer_type,
        user.created_at,
      );
  } catch (error) {
    // The UNIQUE index caught a race the check above could not.
    if (String(error).includes("UNIQUE")) {
      return { errors: { form: "Those details were just registered. Try signing in." } };
    }
    throw error;
  }

  return { user };
}

/**
 * Accepts an email address or a username. The same failure is returned either
 * way, so this never reveals which accounts exist.
 */
export function authenticate(identifier: string, password: string): User | null {
  const trimmed = identifier.trim();
  const row = trimmed.includes("@") ? findUserByEmail(trimmed) : findUserByUsername(trimmed);
  if (!row || !verifyPassword(password, row.password_hash)) return null;

  // Rebuilt field by field rather than spread, so the hash cannot ride along.
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    country: row.country,
    age: row.age,
    developer_type: row.developer_type,
    created_at: row.created_at,
  };
}
