import { AppError } from "./errors.js";

/**
 * Small validation primitives shared by the domain modules. Each throws an
 * AppError the HTTP layer already knows how to render, so routes stay free of
 * validation branches.
 */

export function requireObject(value, field = "body") {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw AppError.badRequest(`${field} must be an object.`);
  }
  return value;
}

export function requireString(value, field, { min = 1, max = 500 } = {}) {
  if (typeof value !== "string") throw AppError.badRequest(`${field} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw AppError.badRequest(`${field} must not be empty.`);
  if (trimmed.length > max) {
    throw AppError.badRequest(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export function optionalText(value, field, { max = 2000 } = {}) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw AppError.badRequest(`${field} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw AppError.badRequest(`${field} must be ${max} characters or fewer.`);
  }
  return trimmed === "" ? null : trimmed;
}

export function requireOneOf(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw AppError.badRequest(`${field} must be one of: ${allowed.join(", ")}.`);
  }
  return value;
}

export function requireInteger(value, field, { min, max } = {}) {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(number)) throw AppError.badRequest(`${field} must be a whole number.`);
  if (min !== undefined && number < min) throw AppError.badRequest(`${field} must be at least ${min}.`);
  if (max !== undefined && number > max) throw AppError.badRequest(`${field} must be at most ${max}.`);
  return number;
}

/**
 * Accepts an ISO 8601 timestamp and stores it normalised to UTC.
 *
 * The baseline treats a due date as a fixed instant, which is the simple
 * reading and the wrong one for repeating tasks — see Problem 1.
 */
export function optionalTimestamp(value, field) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw AppError.badRequest(`${field} must be an ISO 8601 string.`);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw AppError.badRequest(`${field} must be a valid ISO 8601 timestamp.`);
  }
  return parsed.toISOString();
}

/** True when the caller supplied the key at all — lets PATCH tell "absent" from "null". */
export function has(input, key) {
  return Object.prototype.hasOwnProperty.call(input, key);
}
