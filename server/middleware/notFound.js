import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(AppError.notFound('ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`));
}
