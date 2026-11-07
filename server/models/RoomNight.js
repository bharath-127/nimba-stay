import mongoose from 'mongoose';
import { ISO_DATE_REGEX } from '../utils/dates.js';

/**
 * One document per room per occupied night.
 *
 * This collection is the concurrency guard. The unique compound index on
 * { roomId, date } means the database itself refuses a second reservation of
 * the same room-night — two concurrent requests can never both succeed, no
 * matter how they interleave. The booking service inserts these rows together
 * with the Booking (in a transaction when the deployment supports one) and
 * deletes them when a booking is cancelled, which is what makes cancelled
 * bookings "block nothing".
 */
const roomNightSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    date: { type: String, required: true, match: ISO_DATE_REGEX },
  },
  { timestamps: false, versionKey: false }
);

// THE invariant: a room can be reserved at most once per night.
roomNightSchema.index({ roomId: 1, date: 1 }, { unique: true, name: 'uniq_room_night' });
// Cancellation releases all nights of a booking in one deleteMany.
roomNightSchema.index({ bookingId: 1 });

export const RoomNight = mongoose.model('RoomNight', roomNightSchema);
