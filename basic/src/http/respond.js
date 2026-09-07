import { AppError } from "../domain/errors.js";

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
  });
  res.end(payload);
}

export function sendNoContent(res) {
  res.writeHead(204).end();
}

/**
 * The only place an error becomes a response.
 *
 * Anything that is not an AppError is a bug: it gets logged in full and the
 * client is told nothing beyond "internal_error", so stack traces and SQL
 * never reach a browser.
 */
export function sendError(res, error) {
  const known = error instanceof AppError;

  if (!known) console.error("[unhandled]", error);

  const body = {
    error: {
      code: known ? error.code : "internal_error",
      message: known ? error.message : "Something went wrong.",
    },
  };

  if (known && error.details) body.error.details = error.details;

  sendJson(res, known ? error.status : 500, body);
}
