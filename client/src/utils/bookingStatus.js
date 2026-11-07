/**
 * Where a stay sits relative to `today` (all ISO date strings).
 * Display only — the server's `status` field is the source of truth.
 *   upcoming   : check-in after today
 *   in-house   : today is one of the booked nights [checkIn, checkOut)
 *   checked-out: the guest has left (early, or check-out on/before today)
 */
export function stayPhase(checkIn, checkOut, today) {
  if (checkIn > today) return 'upcoming';
  if (checkOut > today) return 'in-house';
  return 'checked-out';
}

/** Phase of a booking record, honouring an explicit early check-out. */
export function bookingPhase(booking, today) {
  if (booking.status === 'checked_out') return 'checked-out';
  return stayPhase(booking.checkIn, booking.checkOut, today);
}

/** A confirmed guest who is in the building today can be checked out. */
export function canCheckOut(booking, today) {
  return booking.status === 'confirmed' && bookingPhase(booking, today) === 'in-house';
}

/** Confirmed stays that have not ended can be cancelled. */
export function canCancel(booking, today) {
  return booking.status === 'confirmed' && bookingPhase(booking, today) !== 'checked-out';
}

export const STAY_PHASE_LABEL = {
  upcoming: 'Upcoming',
  'in-house': 'In-house',
  'checked-out': 'Checked out',
};
