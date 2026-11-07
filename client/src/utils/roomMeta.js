/**
 * Presentational room metadata only. The API does not carry room areas, so
 * the figures shown next to a room are a display map keyed by category —
 * Nimba Nature Cure's published room sizes. Nothing here affects pricing,
 * availability or booking; those always come from the server.
 */
const AREA_SQ_FT = Object.freeze({
  Standard: 200,
  Deluxe: 250,
  Premium: 300,
  Suite: 860,
});

/** Area in square feet for a category, or null when unknown (then omit it). */
export function areaSqFt(category) {
  return AREA_SQ_FT[category] ?? null;
}
