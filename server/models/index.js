import { Room } from './Room.js';
import { Booking } from './Booking.js';
import { RoomNight } from './RoomNight.js';

export { Room, Booking, RoomNight };

/**
 * Make sure every declared index exists before the API accepts traffic.
 * The RoomNight unique index is what prevents double bookings; without it
 * the guarantee silently disappears, so this runs on every startup.
 */
export async function ensureIndexes() {
  await Promise.all([Room.syncIndexes(), Booking.syncIndexes(), RoomNight.syncIndexes()]);
}
