/**
 * The one error type routes throw. The error-handling middleware turns it into
 * a status code and a JSON body; nothing else needs to know about responses.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, "bad_request", message, details);
  }

  static unauthorized(message = "Sign in to continue."): AppError {
    return new AppError(401, "unauthorized", message);
  }

  static forbidden(message = "You do not have access to that."): AppError {
    return new AppError(403, "forbidden", message);
  }

  static notFound(message = "Not found."): AppError {
    return new AppError(404, "not_found", message);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, "conflict", message, details);
  }

  static payloadTooLarge(message = "Request body is too large."): AppError {
    return new AppError(413, "payload_too_large", message);
  }
}
