/**
 * Date helpers for the UI. Dates are ISO `YYYY-MM-DD` strings throughout,
 * matching the API. The server is the authority on night counts and prices;
 * these helpers only drive form defaults and display.
 */

const MS_PER_DAY = 86_400_000;

function toUtc(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso, days) {
  const dt = toUtc(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function countNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  return Math.round((toUtc(checkOut) - toUtc(checkIn)) / MS_PER_DAY);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "Fri, 20 Nov 2026". Built by hand rather than with Intl so the output is
 * identical in every browser, Node version and ICU build.
 */
export function formatDisplayDate(iso) {
  if (!iso) return '';
  const dt = toUtc(iso);
  return `${WEEKDAYS[dt.getUTCDay()]}, ${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

const timestampFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatTimestamp(isoDateTime) {
  if (!isoDateTime) return '';
  return timestampFormatter.format(new Date(isoDateTime));
}
