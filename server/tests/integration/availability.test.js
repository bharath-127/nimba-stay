import { describe, it, expect, beforeEach } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, validBooking, Room } from '../helpers/setup.js';

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
    const res = await search({ checkIn: '2026-11-22', checkOut: '2026-11-20' });
    expect(res.status).toBe(400);
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

  it('rejects an unknown category with 400', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Penthouse' });
    expect(res.status).toBe(400);
  });

  it('rejects a stay longer than 90 nights', async () => {
    const res = await search({ checkIn: '2026-01-01', checkOut: '2026-06-01' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/availability — results', () => {
  it('returns every active room when no category is given, excluding maintenance', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22' });
    expect(res.body.data.count).toBe(9); // 10 seeded, DLX-203 under maintenance
    expect(roomNumbers(res)).not.toContain('DLX-203');
  });

  it('filters by category', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Suite' });
    expect(roomNumbers(res)).toEqual(['STE-401', 'STE-402']);
    expect(res.body.data.category).toBe('Suite');
  });

  it('computes the total price for the whole stay from the stored nightly rate', async () => {
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Deluxe' });
    for (const room of res.body.data.rooms) {
      expect(room.nights).toBe(3);
      expect(room.pricePerNight).toBe(5500);
      expect(room.totalPrice).toBe(16500);
      expect(room.status).toBe('available');
    }
  });

  it('RULE 3: a room put under maintenance disappears from availability', async () => {
    await Room.updateOne({ roomNumber: 'STE-401' }, { status: 'maintenance' });
    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Suite' });
    expect(roomNumbers(res)).toEqual(['STE-402']);
  });
});

describe('GET /api/availability — interaction with bookings', () => {
  let dlx201;

  beforeEach(async () => {
    dlx201 = await roomIdByNumber('DLX-201');
    // Existing stay: nights 20, 21, 22 (check-out on the 23rd)
    const res = await api.post('/api/bookings').send(validBooking({ roomId: dlx201 }));
    expect(res.status).toBe(201);
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
    const res = await search({ checkIn: '2026-11-18', checkOut: '2026-11-21', category: 'Deluxe' });
    expect(roomNumbers(res)).toEqual(['DLX-202']);
  });

  it('RULE 1: the check-out day is free for a new arrival', async () => {
    const res = await search({ checkIn: '2026-11-23', checkOut: '2026-11-25', category: 'Deluxe' });
    expect(roomNumbers(res)).toEqual(['DLX-201', 'DLX-202']);
  });

  it('RULE 1: a stay ending on the existing check-in day does not clash', async () => {
    const res = await search({ checkIn: '2026-11-18', checkOut: '2026-11-20', category: 'Deluxe' });
    expect(roomNumbers(res)).toEqual(['DLX-201', 'DLX-202']);
  });

  it('RULE 2: a cancelled booking blocks nothing', async () => {
    const list = await api.get('/api/bookings');
    const bookingId = list.body.data[0].id;
    await api.patch(`/api/bookings/${bookingId}/cancel`).expect(200);

    const res = await search({ checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Deluxe' });
    expect(roomNumbers(res)).toEqual(['DLX-201', 'DLX-202']);
  });
});
