import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { AppError } from "../domain/errors.js";
import { findSessionUser } from "../repositories/sessions.js";
import type { PublicUser } from "../repositories/users.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** A per-request id. Logging is minimal today; this is the thread to pull on. */
      id: string;
      /** The signed-in user, or null. requireUser() turns null into a 401. */
      user: PublicUser | null;
    }
  }
}

export function attachContext(req: Request, _res: Response, next: NextFunction): void {
  req.id = randomUUID();
  const token = req.cookies?.[config.sessionCookie] as string | undefined;
  req.user = findSessionUser(token);
  next();
}

/** Returns the signed-in user or throws 401. Use it at the top of a handler. */
export function requireUser(req: Request): PublicUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}
