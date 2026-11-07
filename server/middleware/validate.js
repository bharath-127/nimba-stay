import { AppError } from '../utils/AppError.js';

/**
 * Validate `req.query`, `req.body` and/or `req.params` against Zod schemas.
 * Parsed (and coerced/trimmed) values are exposed on `req.validated`, so
 * controllers only ever see data that has passed validation.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    req.validated = req.validated ?? {};
    const issues = [];

    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[source] ?? {});
      if (result.success) {
        req.validated[source] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ field: issue.path.join('.') || source, message: issue.message });
        }
      }
    }

    if (issues.length > 0) {
      return next(AppError.badRequest('VALIDATION_ERROR', 'Invalid request', issues));
    }
    return next();
  };
}
