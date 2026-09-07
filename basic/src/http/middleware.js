import { config } from "../config.js";
import { findSessionUser } from "../db/repositories/sessions.js";
import { AppError } from "../domain/errors.js";

/** Reads and parses a JSON body, refusing anything oversized or malformed. */
export async function readJsonBody(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > config.maxBodyBytes) throw AppError.payloadTooLarge();
    chunks.push(chunk);
  }

  if (size === 0) return {};

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw AppError.badRequest("Body must be valid JSON.");
  }
}

export function parseCookies(header = "") {
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (name) cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

/** The signed-in user, or null. Never throws — routes decide whether it matters. */
export function currentUser(req) {
  const token = parseCookies(req.headers.cookie ?? "")[config.sessionCookie];
  return findSessionUser(token);
}

export function requireUser(req) {
  const user = currentUser(req);
  if (!user) throw AppError.unauthorized();
  return user;
}

/**
 * HttpOnly so script cannot read it, SameSite=Lax so it does not ride along on
 * cross-site POSTs. Secure is opt-in because the starter runs on plain http.
 */
export function setSessionCookie(res, token, expiresAt) {
  const parts = [
    `${config.sessionCookie}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`,
  ];
  if (process.env.COOKIE_SECURE === "true") parts.push("Secure");
  res.setHeader("set-cookie", parts.join("; "));
}

export function clearSessionCookie(res) {
  res.setHeader(
    "set-cookie",
    `${config.sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

export function sessionTokenFrom(req) {
  return parseCookies(req.headers.cookie ?? "")[config.sessionCookie] ?? null;
}
