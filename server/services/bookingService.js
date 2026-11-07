import mongoose from 'mongoose';
import { Room, Booking, RoomNight } from '../models/index.js';
import { supportsTransactions } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { isDuplicateKeyError } from '../utils/mongoErrors.js';
import { ROOM_STATUS, BOOKING_STATUS } from '../utils/constants.js';
import { nightsBetween } from '../utils/dates.js';
import { calculateTotalPrice } from '../utils/pricing.js';

const conflictError = () =>
  AppError.conflict('ROOM_ALREADY_BOOKED', 'This room is no longer available for the selected dates');

/**
 * Create a booking and reserve every night of the stay.
 *
 * Double-booking prevention does NOT rely on checking availability first -
 * that check-then-insert sequence has a race window. Instead every occupied
 * night is written to RoomNight, whose unique { roomId, date } index makes a
 * second reservation of the same night impossible at the database level.
 *
 *   - Replica set / Atlas: Booking + RoomNights are written in ONE transaction.
 *     A duplicate night aborts the transaction, so nothing is left behind.
 *   - Standalone MongoDB: no transactions, so we insert the nights first, then
 *     the booking, and compensate (delete the nights) if either step fails.
 *     The unique index still guarantees that no two bookings share a night.
 */
export async function createBooking({ roomId, guestName, phone, checkIn, checkOut }) {
  const room = await Room.findById(roomId).lean();
  if (!room) throw AppError.notFound('ROOM_NOT_FOUND', 'Room not found');
  if (room.status === ROOM_STATUS.MAINTENANCE) {
    throw AppError.conflict('ROOM_UNAVAILABLE', `Room ${room.roomNumber} is under maintenance and cannot be booked`);
  }

  const nightDates = nightsBetween(checkIn, checkOut);
  const bookingData = {
    roomId: room._id,
    guestName,
    phone,
    checkIn,
    checkOut,
    nights: nightDates.length,
    pricePerNight: room.pricePerNight,
    totalPrice: calculateTotalPrice(nightDates.length, room.pricePerNight),
    status: BOOKING_STATUS.CONFIRMED,
  };

  const booking = supportsTransactions()
    ? await createWithTransaction(bookingData, nightDates)
    : await createWithCompensation(bookingData, nightDates);

  return serializeBooking(booking, room);
}

async function createWithTransaction(bookingData, nightDates) {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const [booking] = await Booking.create([bookingData], { session });
      await RoomNight.insertMany(
        nightDates.map((date) => ({ roomId: bookingData.roomId, bookingId: booking._id, date })),
        { session, ordered: true }
      );
      created = booking;
    });
    return created;
  } catch (err) {
    if (isDuplicateKeyError(err)) throw conflictError();
    throw err;
  } finally {
    await session.endSession();
  }
}

async function createWithCompensation(bookingData, nightDates) {
  const bookingId = new mongoose.Types.ObjectId();
  const releaseNights = () => RoomNight.deleteMany({ bookingId });

  try {
    await RoomNight.insertMany(
      nightDates.map((date) => ({ roomId: bookingData.roomId, bookingId, date })),
      { ordered: true }
    );
  } catch (err) {
    await releaseNights(); // undo any nights inserted before the clash
    if (isDuplicateKeyError(err)) throw conflictError();
    throw err;
  }

  try {
    return await Booking.create({ _id: bookingId, ...bookingData });
  } catch (err) {
    await releaseNights();
    throw err;
  }
}

/**
 * Cancel a booking and release its nights. Idempotent.
 * In fallback mode the status flips first and the nights are released second:
 * if the second step fails the room stays blocked (safe) rather than becoming
 * bookable while a confirmed booking still exists (unsafe).
 */
export async function cancelBooking(bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('BOOKING_NOT_FOUND', 'Booking not found');

  if (booking.status !== BOOKING_STATUS.CANCELLED) {
    booking.status = BOOKING_STATUS.CANCELLED;
    if (supportsTransactions()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await booking.save({ session });
          await RoomNight.deleteMany({ bookingId: booking._id }, { session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      await booking.save();
      await RoomNight.deleteMany({ bookingId: booking._id });
    }
  }

  const room = await Room.findById(booking.roomId).lean();
  return serializeBooking(booking, room);
}

export async function listBookings({ limit = 20 } = {}) {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('roomId', 'roomNumber category')
    .lean();
  return bookings.map((b) => serializeBooking(b, b.roomId));
}

function serializeBooking(booking, room) {
  const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;
  return {
    id: String(b._id),
    roomId: String(room?._id ?? b.roomId),
    room: room ? { id: String(room._id), roomNumber: room.roomNumber, category: room.category } : null,
    guestName: b.guestName,
    phone: b.phone,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: b.nights,
    pricePerNight: b.pricePerNight,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt,
  };
}
