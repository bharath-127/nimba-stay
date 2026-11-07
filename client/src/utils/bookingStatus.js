/**
 * Where a confirmed booking sits relative to `today` (all ISO date strings).
 * Display only — the server's `status` field is the source of truth.
 *   upcoming   : check-in after today
 *   in-house   : today is one of the booked nights [checkIn, checkOut)
 *   checked-out: check-out on or before today
 */
export function stayPhase(checkIn, checkOut, today) {
  if (checkIn > today) return 'upcoming';
  if (checkOut > today) return 'in-house';
  return 'checked-out';
}

export const STAY_PHASE_LABEL = {
  upcoming: 'Upcoming',
  'in-house': 'In-house',
  'checked-out': 'Checked out',
};
