import { beforeAll, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { connectDB, disconnectDB, supportsTransactions } from '../../config/db.js';
import { RoomType, Room, RoomBlock, Booking, RoomNight, ensureIndexes } from '../../models/index.js';
import { seedRooms } from '../../seed.js';
import { createApp } from '../../app.js';

export const api = supertest(createApp());

/**
 * Connects to the TEST database for the whole file and resets every
 * collection before each test. Refuses to run against a database whose
 * name does not contain "test" so dev data is never wiped.
 */
export function useTestDatabase() {
  beforeAll(async () => {
    await connectDB(env.mongoUri);
    if (!/test/i.test(mongoose.connection.name)) {
      throw new Error(`Refusing to run tests against "${mongoose.connection.name}" — MONGO_URI_TEST must point at a test database`);
    }
    await ensureIndexes();
  });

  beforeEach(async () => {
    await seedRooms({ reset: true });
  });

  afterAll(async () => {
    await disconnectDB();
  });
}

export async function roomIdByNumber(roomNumber) {
  const room = await Room.findOne({ roomNumber }).lean();
  if (!room) throw new Error(`Seed room ${roomNumber} not found`);
  return String(room._id);
}

export const validBooking = (overrides = {}) => ({
  guestName: 'Asha Mehta',
  phone: '9876543210',
  checkIn: '2026-11-20',
  checkOut: '2026-11-23',
  ...overrides,
});

/** Create a confirmed booking through the API and return its payload. */
export async function book(roomNumber, overrides = {}) {
  const res = await api.post('/api/bookings').send(validBooking({ roomId: await roomIdByNumber(roomNumber), ...overrides }));
  if (res.status !== 201) throw new Error(`booking ${roomNumber} failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
}

/** Block a room directly in the database (bypasses the API's booking-clash check). */
export async function blockRoom(roomNumber, startDate, endDate = null, reason = 'Test block') {
  const roomId = await roomIdByNumber(roomNumber);
  const block = await RoomBlock.create({ roomId, startDate, endDate, reason });
  return String(block._id);
}

export const dbMode = () => (supportsTransactions() ? 'transactions' : 'fallback');

export { RoomType, Room, RoomBlock, Booking, RoomNight };
