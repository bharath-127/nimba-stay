import { AppError } from '../utils/AppError.js';
import { isDuplicateKeyError } from '../utils/mongoErrors.js';
import { env } from '../config/env.js';

/**
 * Single place where errors become HTTP responses.
 * Every failure is `{ success: false, error: { code, message, details? } }`.
 * Stack traces and database internals are logged, never returned.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again.';
  let details;

  if (err instanceof AppError) {
    ({ statusCode, code, message, details } = err);
  } else if (err?.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err?.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid value for ${err.path}`;
  } else if (err?.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data';
    details = Object.values(err.errors ?? {}).map((e) => ({ field: e.path, message: e.message }));
  } else if (isDuplicateKeyError(err)) {
    statusCode = 409;
    code = 'ROOM_ALREADY_BOOKED';
    message = 'This room is no longer available for the selected dates';
  }

  if (statusCode >= 500 && !env.isTest) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}
