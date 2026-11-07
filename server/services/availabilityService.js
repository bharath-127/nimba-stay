import { Room, Booking, RoomNight } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { BOOKING_STATUS, MIN_CHARGED_NIGHTS } from '../utils/constants.js';
import { countNights, nightsBetween } from '../utils/dates.js';
import { priceStay } from '../utils/pricing.js';
import { activeRoomTypesByName } from './roomTypeService.js';
import { blockedRoomIds } from './roomBlockService.js';

/**
 * Mongo filter for stays that occupy any night of [checkIn, checkOut):
 *   existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 * A guest who checked out early only occupies nights before `checkedOutOn`;
 * cancelled bookings never match.
 */
export function stayOverlapFilter(checkIn, checkOut) {
  return {
    checkIn: { $lt: checkOut },
    $or: [
      { status: BOOKING_STATUS.CONFIRMED, checkOut: { $gt: checkIn } },
      { status: BOOKING_STATUS.CHECKED_OUT, checkedOutOn: { $gt: checkIn } },
    ],
  };
}

/** Ids of the given rooms that are taken (booked, reserved or blocked) for any night of the range. */
export async function heldRoomIds(roomIds, checkIn, checkOut) {
  const [booked, locked, blocked] = await Promise.all([
    Booking.distinct('roomId', { roomId: { $in: roomIds }, ...stayOverlapFilter(checkIn, checkOut) }),
    RoomNight.distinct('roomId', { roomId: { $in: roomIds }, date: { $in: nightsBetween(checkIn, checkOut) } }),
    blockedRoomIds(roomIds, checkIn, checkOut),
  ]);
  return new Set([...booked, ...locked, ...blocked].map(String));
}

/**
 * Rooms free for EVERY night of [checkIn, checkOut), grouped by category
 * (most expensive first) with the price of the stay. Inputs are validated.
 *
 *   never free: inactive rooms, rooms of an inactive type, rooms blocked for
 *               any night of the range, rooms with a confirmed stay or an
 *               early-checkout stay still overlapping the range
 *   always free again: cancelled stays, nights after an early check-out
 */
export async function findAvailableRooms({ checkIn, checkOut, category }) {
  const nights = countNights(checkIn, checkOut);
  const types = await activeRoomTypesByName();

  if (category && !types.has(category)) {
    throw AppError.badRequest('VALIDATION_ERROR', 'Invalid request', [
      { field: 'category', message: `Unknown category "${category}". Available: ${[...types.keys()].join(', ')}` },
    ]);
  }

  const categories = category ? [category] : [...types.keys()];
  const rooms = await Room.find({ isActive: true, category: { $in: categories } }).sort({ roomNumber: 1 }).lean();

  const held = rooms.length ? await heldRoomIds(rooms.map((r) => r._id), checkIn, checkOut) : new Set();

  const groups = [...types.values()]
    .filter((t) => categories.includes(t.name))
    .sort((a, b) => b.pricePerNight - a.pricePerNight || a.name.localeCompare(b.name))
    .map((type) => {
      const pricing = priceStay(nights, type.pricePerNight);
      const free = rooms
        .filter((room) => room.category === type.name && !held.has(String(room._id)))
        .map((room) => ({
          id: String(room._id),
          roomNumber: room.roomNumber,
          category: room.category,
          bedCount: room.bedCount,
          ...pricing,
          status: 'available',
        }));
      return { category: type.name, ...pricing, count: free.length, rooms: free };
    })
    .filter((g) => g.rooms.length > 0);

  const flat = groups.flatMap((g) => g.rooms);
  const { chargedNights } = priceStay(nights, 0);

  return {
    checkIn,
    checkOut,
    nights,
    chargedNights,
    minChargedNights: MIN_CHARGED_NIGHTS,
    category: category ?? null,
    count: flat.length,
    groups,
    rooms: flat,
  };
}
