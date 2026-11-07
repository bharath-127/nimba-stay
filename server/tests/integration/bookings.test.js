import { describe, it, expect, beforeEach } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, validBooking, Booking, RoomNight } from '../helpers/setup.js';

useTestDatabase();

const post = (body) => api.post('/api/bookings').send(body);

describe('POST /api/bookings — success', () => {
  it('creates a confirmed booking and returns 201 with the computed total', async () => {
    const roomId = await roomIdByNumber('DLX-201');
    const res = await post(validBooking({ roomId }));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      roomId,
      room: { roomNumber: 'DLX-201', category: 'Deluxe' },
      guestName: 'Asha Mehta',
      phone: '9876543210',
      checkIn: '2026-11-20',
      checkOut: '2026-11-23',
      nights: 3,
      pricePerNight: 5500,
      totalPrice: 16500,
      status: 'confirmed',
    });
    expect(res.body.data.id).toMatch(/^[0-9a-f]{24}$/);
  });

  it('reserves one RoomNight per night of the stay', async () => {
    const roomId = await roomIdByNumber('STE-401');
    const res = await post(validBooking({ roomId, checkIn: '2026-12-01', checkOut: '2026-12-05' }));
    expect(res.status).toBe(201);

    const nights = await RoomNight.find({ bookingId: res.body.data.id }).sort({ date: 1 }).lean();
    expect(nights.map((n) => n.date)).toEqual(['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04']);
  });

  it('RULE 9: ignores any price supplied by the client', async () => {
    const roomId = await roomIdByNumber('STD-101');
    const res = await post({ ...validBooking({ roomId }), totalPrice: 1, pricePerNight: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.totalPrice).toBe(10500);
    expect(res.body.data.pricePerNight).toBe(3500);
  });

  it('trims the guest name and accepts a numeric phone', async () => {
    const roomId = await roomIdByNumber('STD-102');
    const res = await post(validBooking({ roomId, guestName: '  Ravi Patel  ', phone: 9123456780 }));
    expect(res.status).toBe(201);
    expect(res.body.data.guestName).toBe('Ravi Patel');
    expect(res.body.data.phone).toBe('9123456780');
  });
});

describe('POST /api/bookings — phone validation (RULE 5)', () => {
  let roomId;
  beforeEach(async () => {
    roomId = await roomIdByNumber('DLX-201');
  });

  it.each([
    ['9 digits', '987654321'],
    ['11 digits', '98765432101'],
    ['alphabetic characters', '98765abcde'],
    ['empty', ''],
    ['with spaces', '98765 43210'],
    ['with country code', '+919876543210'],
  ])('rejects a phone that is %s with 400', async (_label, phone) => {
    const res = await post(validBooking({ roomId, phone }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field === 'phone')).toBe(true);
  });

  it('rejects a missing phone with 400', async () => {
    const { phone, ...noPhone } = validBooking({ roomId });
    expect((await post(noPhone)).status).toBe(400);
  });

  it('accepts exactly 10 digits', async () => {
    expect((await post(validBooking({ roomId, phone: '9876543210' }))).status).toBe(201);
  });
});

describe('POST /api/bookings — other validation (RULE 4)', () => {
  let roomId;
  beforeEach(async () => {
    roomId = await roomIdByNumber('DLX-201');
  });

  it('rejects check-out equal to check-in with 400', async () => {
    const res = await post(validBooking({ roomId, checkIn: '2026-11-20', checkOut: '2026-11-20' }));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].message).toMatch(/after check-in/i);
  });

  it('rejects check-out before check-in with 400', async () => {
    expect((await post(validBooking({ roomId, checkIn: '2026-11-22', checkOut: '2026-11-20' }))).status).toBe(400);
  });

  it('rejects invalid and missing dates with 400', async () => {
    expect((await post(validBooking({ roomId, checkIn: '2026-02-30' }))).status).toBe(400);
    expect((await post(validBooking({ roomId, checkOut: 'next week' }))).status).toBe(400);
    const { checkIn, ...noCheckIn } = validBooking({ roomId });
    expect((await post(noCheckIn)).status).toBe(400);
  });

  it('rejects a missing or too-short guest name with 400', async () => {
    expect((await post(validBooking({ roomId, guestName: 'A' }))).status).toBe(400);
    expect((await post(validBooking({ roomId, guestName: '   ' }))).status).toBe(400);
    const { guestName, ...noName } = validBooking({ roomId });
    expect((await post(noName)).status).toBe(400);
  });

  it('rejects a malformed roomId with 400', async () => {
    expect((await post(validBooking({ roomId: 'not-an-id' }))).status).toBe(400);
  });

  it('returns 404 for a room that does not exist', async () => {
    const res = await post(validBooking({ roomId: '64b000000000000000000000' }));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await api.post('/api/bookings').set('content-type', 'application/json').send('{"roomId":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('POST /api/bookings — conflicts (RULES 1, 2, 3, 6)', () => {
  let dlx201;
  let dlx202;

  beforeEach(async () => {
    dlx201 = await roomIdByNumber('DLX-201');
    dlx202 = await roomIdByNumber('DLX-202');
    // Existing stay on DLX-201: nights 20, 21, 22
    expect((await post(validBooking({ roomId: dlx201 }))).status).toBe(201);
  });

  it.each([
    ['the same dates', '2026-11-20', '2026-11-23'],
    ['partially overlapping dates (end)', '2026-11-22', '2026-11-25'],
    ['partially overlapping dates (start)', '2026-11-18', '2026-11-21'],
    ['a stay inside the existing booking', '2026-11-21', '2026-11-22'],
    ['a stay containing the existing booking', '2026-11-18', '2026-11-26'],
  ])('returns 409 for %s', async (_label, checkIn, checkOut) => {
    const res = await post(validBooking({ roomId: dlx201, guestName: 'Second Guest', checkIn, checkOut }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_ALREADY_BOOKED');
  });

  it('leaves no partial data behind after a conflict', async () => {
    await post(validBooking({ roomId: dlx201, guestName: 'Second Guest', checkIn: '2026-11-22', checkOut: '2026-11-25' }));
    expect(await Booking.countDocuments({ roomId: dlx201 })).toBe(1);
    expect(await RoomNight.countDocuments({ roomId: dlx201 })).toBe(3);
  });

  it('RULE 1: allows check-in on the previous guest\'s check-out day', async () => {
    const res = await post(validBooking({ roomId: dlx201, guestName: 'Next Guest', checkIn: '2026-11-23', checkOut: '2026-11-25' }));
    expect(res.status).toBe(201);
  });

  it('RULE 1: allows check-out on the next guest\'s check-in day', async () => {
    const res = await post(validBooking({ roomId: dlx201, guestName: 'Earlier Guest', checkIn: '2026-11-18', checkOut: '2026-11-20' }));
    expect(res.status).toBe(201);
  });

  it('RULE 2: a cancelled booking does not cause a conflict', async () => {
    const list = await api.get('/api/bookings');
    await api.patch(`/api/bookings/${list.body.data[0].id}/cancel`).expect(200);

    const res = await post(validBooking({ roomId: dlx201, guestName: 'Replacement Guest' }));
    expect(res.status).toBe(201);
  });

  it('RULE 3: refuses to book a maintenance room with 409', async () => {
    const dlx203 = await roomIdByNumber('DLX-203');
    const res = await post(validBooking({ roomId: dlx203, checkIn: '2026-12-01', checkOut: '2026-12-02' }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_UNAVAILABLE');
    expect(await Booking.countDocuments({ roomId: dlx203 })).toBe(0);
  });

  it('allows a different room for the same dates', async () => {
    const res = await post(validBooking({ roomId: dlx202 }));
    expect(res.status).toBe(201);
  });
});

describe('GET /api/bookings', () => {
  it('lists bookings newest first with room details', async () => {
    const std101 = await roomIdByNumber('STD-101');
    const std102 = await roomIdByNumber('STD-102');
    await post(validBooking({ roomId: std101, guestName: 'First' }));
    await post(validBooking({ roomId: std102, guestName: 'Second' }));

    const res = await api.get('/api/bookings').query({ limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.data.map((b) => b.guestName)).toEqual(['Second', 'First']);
    expect(res.body.data[0].room.roomNumber).toBe('STD-102');
  });

  it('rejects an invalid limit with 400', async () => {
    expect((await api.get('/api/bookings').query({ limit: 0 })).status).toBe(400);
    expect((await api.get('/api/bookings').query({ limit: 'many' })).status).toBe(400);
  });
});
