/**
 * Seed room types, rooms and one maintenance block.
 *
 *   npm run seed            - inserts whatever does not exist yet (idempotent;
 *                             existing records are never modified)
 *   npm run seed -- --reset - wipes everything first
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { RoomType, Room, RoomBlock, Booking, RoomNight, ensureIndexes } from './models/index.js';

export const SEED_ROOM_TYPES = [
  { name: 'Standard', pricePerNight: 3500 },
  { name: 'Deluxe', pricePerNight: 5500 },
  { name: 'Premium', pricePerNight: 8500 },
  { name: 'Suite', pricePerNight: 12000 },
];

export const SEED_ROOMS = [
  { roomNumber: 'STD-101', category: 'Standard', bedCount: 1 },
  { roomNumber: 'STD-102', category: 'Standard', bedCount: 2 },
  { roomNumber: 'STD-103', category: 'Standard', bedCount: 2 },
  { roomNumber: 'DLX-201', category: 'Deluxe', bedCount: 2 },
  { roomNumber: 'DLX-202', category: 'Deluxe', bedCount: 2 },
  { roomNumber: 'DLX-203', category: 'Deluxe', bedCount: 2 },
  { roomNumber: 'PRM-301', category: 'Premium', bedCount: 2 },
  { roomNumber: 'PRM-302', category: 'Premium', bedCount: 2 },
  { roomNumber: 'STE-401', category: 'Suite', bedCount: 2 },
  { roomNumber: 'STE-402', category: 'Suite', bedCount: 3 },
];

// DLX-203 is out of service until someone lifts the block - it must never be offered.
export const SEED_BLOCKS = [{ roomNumber: 'DLX-203', startDate: '2026-01-01', endDate: null, reason: 'Under maintenance' }];

export async function seedRooms({ reset = false } = {}) {
  if (reset) {
    await Promise.all([RoomNight.deleteMany({}), Booking.deleteMany({}), RoomBlock.deleteMany({}), Room.deleteMany({}), RoomType.deleteMany({})]);
  }

  const types = await RoomType.bulkWrite(
    SEED_ROOM_TYPES.map((t) => ({
      updateOne: { filter: { name: t.name }, update: { $setOnInsert: { isActive: true, ...t } }, upsert: true },
    }))
  );
  const rooms = await Room.bulkWrite(
    SEED_ROOMS.map((r) => ({
      updateOne: { filter: { roomNumber: r.roomNumber }, update: { $setOnInsert: { isActive: true, ...r } }, upsert: true },
    }))
  );

  let blocksInserted = 0;
  for (const b of SEED_BLOCKS) {
    const room = await Room.findOne({ roomNumber: b.roomNumber }).lean();
    const existing = await RoomBlock.findOne({ roomId: room._id, endDate: null }).lean();
    if (!existing) {
      await RoomBlock.create({ roomId: room._id, startDate: b.startDate, endDate: b.endDate, reason: b.reason });
      blocksInserted += 1;
    }
  }

  return {
    reset,
    roomTypes: { inserted: types.upsertedCount, skipped: SEED_ROOM_TYPES.length - types.upsertedCount },
    rooms: { inserted: rooms.upsertedCount, skipped: SEED_ROOMS.length - rooms.upsertedCount },
    blocks: { inserted: blocksInserted, skipped: SEED_BLOCKS.length - blocksInserted },
  };
}

// Run only when executed directly (`node seed.js`), not when imported by tests.
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  const reset = process.argv.includes('--reset');
  connectDB(env.mongoUri)
    .then(ensureIndexes)
    .then(() => seedRooms({ reset }))
    .then(async (s) => {
      console.log(
        `Seed complete${s.reset ? ' (after reset)' : ''}: room types ${s.roomTypes.inserted} inserted / ${s.roomTypes.skipped} present, ` +
          `rooms ${s.rooms.inserted} / ${s.rooms.skipped}, blocks ${s.blocks.inserted} / ${s.blocks.skipped}.`
      );
      const types = new Map((await RoomType.find().lean()).map((t) => [t.name, t.pricePerNight]));
      const blocked = new Set((await RoomBlock.find({ endDate: null }).lean()).map((b) => String(b.roomId)));
      const rooms = await Room.find().sort({ roomNumber: 1 }).lean();
      console.table(
        rooms.map((r) => ({
          room: r.roomNumber,
          category: r.category,
          beds: r.bedCount,
          pricePerNight: types.get(r.category),
          state: !r.isActive ? 'inactive' : blocked.has(String(r._id)) ? 'blocked (maintenance)' : 'in service',
        }))
      );
    })
    .catch((err) => {
      console.error('Seed failed:', err.message);
      process.exitCode = 1;
    })
    .finally(disconnectDB);
}
