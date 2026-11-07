import { describe, it, expect, beforeEach } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, book, blockRoom, Room, RoomType } from '../helpers/setup.js';

useTestDatabase();

const search = (params) => api.get('/api/availability').query(params);
const roomNumbers = (res) => res.body.data.rooms.map((r) => r.roomNumber);

describe('GET /api/availability — validation', () => {
  it('accepts a valid check-in and check-out', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nights).toBe(2);
  });

  it('rejects the same check-in and check-out with 400', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-20' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('checkOut');
  });

  it('rejects check-out before check-in with 400', async () => {
    expect((await search({ checkIn: '2026-11-22', checkOut: '2026-11-20' })).status).toBe(400);
  });

  it('rejects invalid dates with 400', async () => {
    expect((await search({ checkIn: '2026-02-30', checkOut: '2026-03-02' })).status).toBe(400);
    expect((await search({ checkIn: 'tomorrow', checkOut: '2026-03-02' })).status).toBe(400);
    expect((await search({ checkIn: '20/11/2026', checkOut: '22/11/2026' })).status).toBe(400);
  });

  it('rejects missing dates with 400 and names the field', async () => {
    const res = await search({ checkOut: '2026-11-22' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toContain('checkIn');
    expect((await search({})).status).toBe(400);
  });

  it('rejects an unknown category with 400 and lists the valid ones', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Penthouse' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toMatchObject({ field: 'category' });
    expect(res.body.error.details[0].message).toMatch(/Standard, Deluxe, Premium, Suite/);
  });

  it('rejects a stay longer than 90 nights', async () => {
    expect((await search({ checkIn: '2026-01-01', checkOut: '2026-06-01' })).status).toBe(400);
  });
});

describe('GET /api/availability — results and pricing', () => {
  it('returns every in-service room when no category is given, excluding the blocked one', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22' });
    expect(res.body.data.count).toBe(9); // 10 seeded, DLX-203 blocked for maintenance
    expect(roomNumbers(res)).not.toContain('DLX-203');
  });

  it('groups rooms by category, most expensive first, with per-group pricing', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-23' });
    const groups = res.body.data.groups;
    expect(groups.map((g) => g.category)).toEqual(['Suite', 'Premium', 'Deluxe', 'Standard']);
    expect(groups.map((g) => g.count)).toEqual([2, 2, 2, 3]);
    expect(groups[0]).toMatchObject({ pricePerNight: 12000, nights: 3, chargedNights: 3, totalPrice: 36000 });
    expect(groups[0].rooms.map((r) => r.roomNumber)).toEqual(['STE-401', 'STE-402']);
  });

  it('filters by category', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Suite' });
    expect(roomNumbers(res)).toEqual(['STE-401', 'STE-402']);
    expect(res.body.data.category).toBe('Suite');
    expect(res.body.data.groups).toHaveLength(1);
  });

  it('computes the stay price from the room type rate stored in the database', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Deluxe' });
    for (const room of res.body.data.rooms) {
      expect(room).toMatchObject({ category: 'Deluxe', nights: 3, chargedNights: 3, pricePerNight: 5500, totalPrice: 16500, status: 'available' });
      expect(room.bedCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('charges a 1-night stay for exactly 1 night (no minimum-night policy)', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-21', category: 'Standard' });
    expect(res.body.data).toMatchObject({ nights: 1, chargedNights: 1, minChargedNights: 1 });
    for (const room of res.body.data.rooms) {
      expect(room).toMatchObject({ nights: 1, chargedNights: 1, pricePerNight: 3500, totalPrice: 3500 });
    }
  });

  it('reflects a changed room-type rate immediately', async () => {
    await RoomType.updateOne({ name: 'Suite' }, { pricePerNight: 15000 });
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Suite' });
    expect(res.body.data.rooms[0]).toMatchObject({ pricePerNight: 15000, totalPrice: 45000 });
  });
});

describe('GET /api/availability — RULE 3: rooms out of service are never free', () => {
  const range = { checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Suite' };

  it('a block covering any night of the stay hides the room', async () => {
    await blockRoom('STE-401', '2026-11-22', '2026-11-25'); // overlaps the last night only
    expect(roomNumbers(await search(range))).toEqual(['STE-402']);
  });

  it('a block outside the stay does not hide the room', async () => {
    await blockRoom('STE-401', '2026-11-23', '2026-11-30'); // starts on the check-out day
    await blockRoom('STE-402', '2026-11-10', '2026-11-20'); // ends on the check-in day
    expect(roomNumbers(await search(range))).toEqual(['STE-401', 'STE-402']);
  });

  it('an open-ended block hides the room for every future date', async () => {
    await blockRoom('STE-401', '2026-11-01', null);
    expect(roomNumbers(await search(range))).toEqual(['STE-402']);
    expect(roomNumbers(await search({ ...range, checkIn: '2027-06-01', checkOut: '2027-06-05' }))).toEqual(['STE-402']);
  });

  it('an inactive room is never offered', async () => {
    await Room.updateOne({ roomNumber: 'STE-401' }, { isActive: false });
    expect(roomNumbers(await search(range))).toEqual(['STE-402']);
  });

  it('rooms of an inactive room type are never offered', async () => {
    await RoomType.updateOne({ name: 'Suite' }, { isActive: false });
    expect((await search({ checkIn: '2026-11-20', checkOut: '2026-11-23' })).body.data.groups.map((g) => g.category)).toEqual([
      'Premium',
      'Deluxe',
      'Standard',
    ]);
    expect((await search(range)).status).toBe(400); // the category no longer exists for callers
  });
});

describe('GET /api/availability — interaction with bookings', () => {
  beforeEach(async () => {
    // Existing stay on DLX-201: nights 20, 21, 22 (check-out on the 23rd)
    await book('DLX-201');
  });

  it('excludes a room booked for any night of the requested stay', async () => {
    for (const [checkIn, checkOut] of [
      ['2026-11-20', '2026-11-23'], // identical
      ['2026-11-22', '2026-11-25'], // partial overlap at the end
      ['2026-11-18', '2026-11-21'], // partial overlap at the start
      ['2026-11-21', '2026-11-22'], // inside
      ['2026-11-18', '2026-11-26'], // containing
    ]) {
      const res = await search({ checkIn, checkOut, category: 'Deluxe' });
      expect(roomNumbers(res), `${checkIn}..${checkOut}`).toEqual(['DLX-202']);
    }
  });

  it('does not check only the first night: a later clashing night still blocks the room', async () => {
    expect(roomNumbers(await search({ checkIn: '2026-11-18', checkOut: '2026-11-21', category: 'Deluxe' }))).toEqual(['DLX-202']);
  });

  it('RULE 1: the check-out day is free for a new arrival', async () => {
    expect(roomNumbers(await search({ checkIn: '2026-11-23', checkOut: '2026-11-25', category: 'Deluxe' }))).toEqual(['DLX-201', 'DLX-202']);
  });

  it('RULE 1: a stay ending on the existing check-in day does not clash', async () => {
    expect(roomNumbers(await search({ checkIn: '2026-11-18', checkOut: '2026-11-20', category: 'Deluxe' }))).toEqual(['DLX-201', 'DLX-202']);
  });

  it('RULE 2: a cancelled booking blocks nothing', async () => {
    const list = await api.get('/api/bookings');
    await api.patch(`/api/bookings/${list.body.data[0].id}/cancel`).expect(200);
    expect(roomNumbers(await search({ checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Deluxe' }))).toEqual(['DLX-201', 'DLX-202']);
  });

  it('an early check-out frees the remaining nights but not the nights already stayed', async () => {
    const list = await api.get('/api/bookings');
    await api.patch(`/api/bookings/${list.body.data[0].id}/check-out`).send({ date: '2026-11-21' }).expect(200);

    expect(roomNumbers(await search({ checkIn: '2026-11-21', checkOut: '2026-11-23', category: 'Deluxe' }))).toEqual(['DLX-201', 'DLX-202']);
    expect(roomNumbers(await search({ checkIn: '2026-11-20', checkOut: '2026-11-21', category: 'Deluxe' }))).toEqual(['DLX-202']);
  });

  it('agrees with the summary cards for the same dates', async () => {
    const range = { checkIn: '2026-11-20', checkOut: '2026-11-23' };
    const [availability, stats] = await Promise.all([search(range), api.get('/api/stats').query(range)]);
    expect(stats.body.data.availableRooms).toBe(availability.body.data.count);
  });
});
