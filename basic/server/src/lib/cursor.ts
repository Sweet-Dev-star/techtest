import { AppError } from "../domain/errors.js";

/**
 * Opaque keyset cursors: a base64url-encoded [value, id] pair. Keyset rather
 * than OFFSET, so pagination stays on an index and does not drift when rows are
 * inserted or deleted mid-scroll.
 */

export type CursorValue = string | number;

export function encodeCursor(value: CursorValue, id: string): string {
  return Buffer.from(JSON.stringify([value, id]), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): [CursorValue, string] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw AppError.badRequest("Invalid cursor.");
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) throw AppError.badRequest("Invalid cursor.");
  const [value, id] = parsed as [unknown, unknown];
  if ((typeof value !== "string" && typeof value !== "number") || typeof id !== "string") {
    throw AppError.badRequest("Invalid cursor.");
  }
  return [value, id];
}
