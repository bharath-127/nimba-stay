/** Seed names only — the live list comes from the RoomType collection. */
export const DEFAULT_ROOM_TYPES = Object.freeze(['Standard', 'Deluxe', 'Premium', 'Suite']);

export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  CHECKED_OUT: 'checked_out',
});

/** Upper bound on a single stay. Bounds the number of RoomNight rows per booking. */
export const MAX_STAY_NIGHTS = 90;

/**
 * Minimum nights a stay is billed for. 1 = stays are charged for their
 * actual nights (1 night = 1 night's rate). The API still carries
 * `chargedNights` (equal to `nights` at this setting), so a minimum-night
 * policy can be switched on later by changing this one constant.
 */
export const MIN_CHARGED_NIGHTS = 1;

export const PHONE_REGEX = /^\d{10}$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
