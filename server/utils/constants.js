/** Seed names only — the live list comes from the RoomType collection. */
export const DEFAULT_ROOM_TYPES = Object.freeze(['Standard', 'Deluxe', 'Premium', 'Suite']);

export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  CHECKED_OUT: 'checked_out',
});

/** Upper bound on a single stay. Bounds the number of RoomNight rows per booking. */
export const MAX_STAY_NIGHTS = 90;

/** Every stay is charged for at least this many nights, however short it is. */
export const MIN_CHARGED_NIGHTS = 3;

export const PHONE_REGEX = /^\d{10}$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
