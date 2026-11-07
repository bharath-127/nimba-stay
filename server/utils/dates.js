/**
 * Calendar-date helpers.
 *
 * All booking dates in Nimba Stay are calendar days, not instants, so they are
 * handled as ISO `YYYY-MM-DD` strings end to end. Two properties make this safe:
 *   1. ISO date strings compare lexicographically in chronological order, so the
 *      overlap predicate works directly on strings (`$lt` / `$gt` in Mongo too).
 *   2. We never read local-time fields from a `Date`, so there is no timezone drift.
 *
 * A stay is the half-open interval [checkIn, checkOut): the check-out day is not
 * an occupied night. That is what makes "leaving 20 Nov does not block arriving
 * 20 Nov" fall out naturally rather than needing a special case.
 */

export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_REGEX.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function toUtcDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const dt = toUtcDate(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatIsoDate(dt);
}

/** Number of nights in [checkIn, checkOut). Negative or zero when the range is invalid. */
export function countNights(checkIn, checkOut) {
  return Math.round((toUtcDate(checkOut) - toUtcDate(checkIn)) / MS_PER_DAY);
}

/** Every occupied night of the stay as ISO dates — check-out day excluded. */
export function nightsBetween(checkIn, checkOut) {
  const total = countNights(checkIn, checkOut);
  if (total <= 0) return [];
  const nights = [];
  let current = checkIn;
  for (let i = 0; i < total; i += 1) {
    nights.push(current);
    current = addDays(current, 1);
  }
  return nights;
}

/**
 * Two half-open stays overlap when each starts before the other ends:
 *   existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 * Adjacent stays (one ends the day the other starts) do NOT overlap.
 */
export function rangesOverlap(aCheckIn, aCheckOut, bCheckIn, bCheckOut) {
  return aCheckIn < bCheckOut && aCheckOut > bCheckIn;
}

export function todayIso() {
  return formatIsoDate(new Date());
}
