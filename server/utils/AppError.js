/**
 * Operational error with an HTTP status and a stable machine-readable code.
 * The error middleware turns these into the standard JSON error envelope.
 */
export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(code, message, details) {
    return new AppError(400, code, message, details);
  }

  static notFound(code, message) {
    return new AppError(404, code, message);
  }

  static conflict(code, message) {
    return new AppError(409, code, message);
  }
}
