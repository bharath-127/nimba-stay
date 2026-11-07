import { RoomType } from './RoomType.js';
import { Room } from './Room.js';
import { RoomBlock } from './RoomBlock.js';
import { Booking } from './Booking.js';
import { RoomNight } from './RoomNight.js';

export { RoomType, Room, RoomBlock, Booking, RoomNight };

/**
 * Make sure every declared index exists before the API accepts traffic.
 * The RoomNight unique index is what prevents double bookings; without it
 * the guarantee silently disappears, so this runs on every startup.
 */
export async function ensureIndexes() {
  await Promise.all([
    RoomType.syncIndexes(),
    Room.syncIndexes(),
    RoomBlock.syncIndexes(),
    Booking.syncIndexes(),
    RoomNight.syncIndexes(),
  ]);
}
