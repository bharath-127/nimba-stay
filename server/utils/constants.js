export const ROOM_CATEGORIES = Object.freeze(['Standard', 'Deluxe', 'Premium', 'Suite']);

export const ROOM_STATUS = Object.freeze({
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
});

export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

/** Upper bound on a single stay. Bounds the number of RoomNight rows per booking. */
export const MAX_STAY_NIGHTS = 90;

export const PHONE_REGEX = /^\d{10}$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
