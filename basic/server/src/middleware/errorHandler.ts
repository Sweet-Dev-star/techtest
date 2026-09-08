import type { NextFunction, Request, Response } from "express";
import { AppError } from "../domain/errors.js";

/** Wraps an async handler so a thrown/rejected error reaches the error middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => unknown,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`No route matches ${req.method} ${req.path}.`));
}

/**
 * The one place an error becomes a response. Anything that is not an AppError is
 * a bug: it is logged in full, and the client is told only "internal_error", so
 * stack traces and SQL never reach a browser.
 */
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const known = error instanceof AppError;

  if (!known) {
    console.error(`[${req.id}] unhandled error on ${req.method} ${req.path}:`, error);
  }

  const status = known ? error.status : 500;
  const body: { error: { code: string; message: string; details?: unknown } } = {
    error: {
      code: known ? error.code : "internal_error",
      message: known ? error.message : "Something went wrong.",
    },
  };
  if (known && error.details !== undefined) body.error.details = error.details;

  res.status(status).json(body);
}
