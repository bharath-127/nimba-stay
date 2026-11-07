import { Room, Booking, RoomNight } from '../models/index.js';
import { ROOM_STATUS, BOOKING_STATUS } from '../utils/constants.js';
import { countNights, nightsBetween } from '../utils/dates.js';
import { calculateTotalPrice } from '../utils/pricing.js';

/**
 * Rooms that are free for EVERY night of [checkIn, checkOut), with the total
 * price of the stay. Inputs are already validated.
 *
 * Two indexed queries, independent of how many rooms match:
 *   1. candidate rooms  - status 'active' (maintenance rooms are never free), optional category
 *   2. blocked rooms    - the standard overlap predicate on confirmed bookings
 *                           existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 *      plus a lookup against the RoomNight lock table, so the screen never
 *      offers a room the unique index would reject at booking time.
 * Cancelled bookings are excluded by status and have no RoomNight rows, so
 * they block nothing.
 */
export async function findAvailableRooms({ checkIn, checkOut, category }) {
  const nights = countNights(checkIn, checkOut);

  const roomFilter = { status: ROOM_STATUS.ACTIVE, ...(category ? { category } : {}) };
  const rooms = await Room.find(roomFilter).sort({ category: 1, roomNumber: 1 }).lean();

  if (rooms.length === 0) {
    return { checkIn, checkOut, nights, category: category ?? null, count: 0, rooms: [] };
  }

  const roomIds = rooms.map((r) => r._id);
  const [bookedRoomIds, lockedRoomIds] = await Promise.all([
    Booking.distinct('roomId', {
      roomId: { $in: roomIds },
      status: BOOKING_STATUS.CONFIRMED,
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    }),
    RoomNight.distinct('roomId', {
      roomId: { $in: roomIds },
      date: { $in: nightsBetween(checkIn, checkOut) },
    }),
  ]);

  const blocked = new Set([...bookedRoomIds, ...lockedRoomIds].map(String));

  const available = rooms
    .filter((room) => !blocked.has(String(room._id)))
    .map((room) => ({
      id: String(room._id),
      roomNumber: room.roomNumber,
      category: room.category,
      pricePerNight: room.pricePerNight,
      nights,
      totalPrice: calculateTotalPrice(nights, room.pricePerNight),
      status: 'available',
    }));

  return { checkIn, checkOut, nights, category: category ?? null, count: available.length, rooms: available };
}
