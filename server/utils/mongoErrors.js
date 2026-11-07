/**
 * True when `err` is (or wraps) a MongoDB duplicate-key error (code 11000).
 * Covers a plain insert, `insertMany` (MongoBulkWriteError) and errors
 * surfaced from inside a transaction callback.
 */
export function isDuplicateKeyError(err) {
  if (!err) return false;
  if (err.code === 11000) return true;
  if (Array.isArray(err.writeErrors) && err.writeErrors.some((e) => e.code === 11000)) return true;
  if (err.cause && isDuplicateKeyError(err.cause)) return true;
  return false;
}
