/**
 * The one error type routes throw. The HTTP layer turns it into a status code
 * and a JSON body; nothing else in the app needs to know about responses.
 */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }

  static badRequest(message, details) {
    return new AppError(400, "bad_request", message, details);
  }

  static unauthorized(message = "Sign in to continue.") {
    return new AppError(401, "unauthorized", message);
  }

  static forbidden(message = "You do not have access to that.") {
    return new AppError(403, "forbidden", message);
  }

  static notFound(message = "Not found.") {
    return new AppError(404, "not_found", message);
  }

  static conflict(message, details) {
    return new AppError(409, "conflict", message, details);
  }

  static payloadTooLarge(message = "Request body is too large.") {
    return new AppError(413, "payload_too_large", message);
  }
}
