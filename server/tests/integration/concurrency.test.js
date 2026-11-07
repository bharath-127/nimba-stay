import { describe, it, expect } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, validBooking, dbMode, Booking, RoomNight } from '../helpers/setup.js';

useTestDatabase();

/**
 * RULE 7 — two simultaneous requests for the same room and overlapping dates
 * must never both succeed. These tests fire the requests concurrently against
 * the live Express app and MongoDB; the outcome is decided by the unique
 * { roomId, date } index on RoomNight, not by request ordering in JavaScript.
 */
describe('concurrent bookings', () => {
  it('reports which write path is under test', () => {
    // Evaluated after beforeAll has connected, unlike a describe() title.
    console.log(`[concurrency] write path under test: ${dbMode()}`);
    expect(['transactions', 'fallback']).toContain(dbMode());
  });

  it('two simultaneous identical requests: exactly one 201 and one 409', async () => {
    const roomId = await roomIdByNumber('STE-401');
    const body = validBooking({ roomId });

    const [a, b] = await Promise.all([api.post('/api/bookings').send(body), api.post('/api/bookings').send(body)]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await Booking.countDocuments({ roomId, status: 'confirmed' })).toBe(1);
    expect(await RoomNight.countDocuments({ roomId })).toBe(3);
  });

  it('ten simultaneous overlapping requests: exactly one succeeds', async () => {
    const roomId = await roomIdByNumber('STE-402');
    // Different but overlapping ranges, all touching the night of 2026-12-12
    const ranges = Array.from({ length: 10 }, (_, i) => ({
      checkIn: `2026-12-${String(8 + (i % 5)).padStart(2, '0')}`,
      checkOut: `2026-12-${String(13 + (i % 4)).padStart(2, '0')}`,
    }));

    const results = await Promise.all(
      ranges.map((range, i) => api.post('/api/bookings').send(validBooking({ roomId, guestName: `Guest ${i}`, ...range })))
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(9);

    const winner = results.find((r) => r.status === 201).body.data;
    expect(await Booking.countDocuments({ roomId, status: 'confirmed' })).toBe(1);
    expect(await RoomNight.countDocuments({ roomId })).toBe(winner.nights);
  });

  it('leaves no duplicate or orphaned room-night rows behind', async () => {
    const roomId = await roomIdByNumber('PRM-302');
    const body = validBooking({ roomId, checkIn: '2026-12-20', checkOut: '2026-12-24' });
    await Promise.all(Array.from({ length: 6 }, () => api.post('/api/bookings').send(body)));

    // No two rows share a (roomId, date)
    const dupes = await RoomNight.aggregate([
      { $group: { _id: { roomId: '$roomId', date: '$date' }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    ]);
    expect(dupes).toEqual([]);

    // Every row belongs to a confirmed booking
    const confirmedIds = new Set((await Booking.find({ status: 'confirmed' }).lean()).map((b) => String(b._id)));
    const rows = await RoomNight.find().lean();
    expect(rows.length).toBe(4);
    for (const row of rows) expect(confirmedIds.has(String(row.bookingId))).toBe(true);
  });

  it('concurrent requests for DIFFERENT rooms all succeed', async () => {
    const ids = await Promise.all(['STD-101', 'STD-102', 'STD-103'].map(roomIdByNumber));
    const results = await Promise.all(ids.map((roomId) => api.post('/api/bookings').send(validBooking({ roomId }))));
    expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
  });
});
