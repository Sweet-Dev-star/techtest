import type { Response } from "express";
import { config } from "../config.js";

/**
 * HttpOnly so script cannot read it, SameSite=Lax so it does not ride along on
 * cross-site POSTs. Secure is opt-in because the starter runs on plain http.
 */
export function setSessionCookie(res: Response, token: string, expiresAt: string): void {
  res.cookie(config.sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.sessionCookie, { path: "/" });
}
