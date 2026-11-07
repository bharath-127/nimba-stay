/**
 * Seed sample rooms.
 *
 *   npm run seed            - inserts any rooms that don't exist yet (idempotent;
 *                             existing rooms are never modified)
 *   npm run seed -- --reset - wipes rooms, bookings and room-nights first
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { Room, Booking, RoomNight, ensureIndexes } from './models/index.js';
import { ROOM_STATUS } from './utils/constants.js';

export const SEED_ROOMS = [
  { roomNumber: 'STD-101', category: 'Standard', pricePerNight: 3500 },
  { roomNumber: 'STD-102', category: 'Standard', pricePerNight: 3500 },
  { roomNumber: 'STD-103', category: 'Standard', pricePerNight: 3500 },
  { roomNumber: 'DLX-201', category: 'Deluxe', pricePerNight: 5500 },
  { roomNumber: 'DLX-202', category: 'Deluxe', pricePerNight: 5500 },
  // Under maintenance - must never appear as available.
  { roomNumber: 'DLX-203', category: 'Deluxe', pricePerNight: 5500, status: ROOM_STATUS.MAINTENANCE },
  { roomNumber: 'PRM-301', category: 'Premium', pricePerNight: 8500 },
  { roomNumber: 'PRM-302', category: 'Premium', pricePerNight: 8500 },
  { roomNumber: 'STE-401', category: 'Suite', pricePerNight: 12000 },
  { roomNumber: 'STE-402', category: 'Suite', pricePerNight: 12000 },
];

export async function seedRooms({ reset = false } = {}) {
  if (reset) {
    await Promise.all([RoomNight.deleteMany({}), Booking.deleteMany({}), Room.deleteMany({})]);
  }
  const result = await Room.bulkWrite(
    SEED_ROOMS.map((room) => ({
      updateOne: {
        filter: { roomNumber: room.roomNumber },
        update: { $setOnInsert: { status: ROOM_STATUS.ACTIVE, ...room } },
        upsert: true,
      },
    }))
  );
  return { inserted: result.upsertedCount, skipped: SEED_ROOMS.length - result.upsertedCount, reset };
}

// Run only when executed directly (`node seed.js`), not when imported by tests.
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const reset = process.argv.includes('--reset');
  connectDB(env.mongoUri)
    .then(ensureIndexes)
    .then(() => seedRooms({ reset }))
    .then(async (summary) => {
      const rooms = await Room.find().sort({ roomNumber: 1 }).lean();
      console.log(
        `Seed complete${summary.reset ? ' (after reset)' : ''}: ${summary.inserted} inserted, ${summary.skipped} already present.`
      );
      console.table(
        rooms.map((r) => ({ room: r.roomNumber, category: r.category, pricePerNight: r.pricePerNight, status: r.status }))
      );
    })
    .catch((err) => {
      console.error('Seed failed:', err.message);
      process.exitCode = 1;
    })
    .finally(disconnectDB);
}
