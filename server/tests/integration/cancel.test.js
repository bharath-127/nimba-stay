import { describe, it, expect, beforeEach } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, validBooking, Booking, RoomNight } from '../helpers/setup.js';

useTestDatabase();

describe('PATCH /api/bookings/:id/cancel', () => {
  let roomId;
  let bookingId;

  beforeEach(async () => {
    roomId = await roomIdByNumber('PRM-301');
    const res = await api.post('/api/bookings').send(validBooking({ roomId }));
    expect(res.status).toBe(201);
    bookingId = res.body.data.id;
  });

  it('marks the booking cancelled and releases every reserved night', async () => {
    expect(await RoomNight.countDocuments({ bookingId })).toBe(3);

    const res = await api.patch(`/api/bookings/${bookingId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(res.body.data.id).toBe(bookingId);

    expect(await RoomNight.countDocuments({ bookingId })).toBe(0);
    expect((await Booking.findById(bookingId)).status).toBe('cancelled');
  });

  it('makes the room bookable again for the same dates', async () => {
    await api.patch(`/api/bookings/${bookingId}/cancel`).expect(200);

    const availability = await api.get('/api/availability').query({ checkIn: '2026-11-20', checkOut: '2026-11-23', category: 'Premium' });
    expect(availability.body.data.rooms.map((r) => r.roomNumber)).toContain('PRM-301');

    const rebook = await api.post('/api/bookings').send(validBooking({ roomId, guestName: 'New Guest' }));
    expect(rebook.status).toBe(201);
  });

  it('is idempotent', async () => {
    await api.patch(`/api/bookings/${bookingId}/cancel`).expect(200);
    const again = await api.patch(`/api/bookings/${bookingId}/cancel`);
    expect(again.status).toBe(200);
    expect(again.body.data.status).toBe('cancelled');
  });

  it('returns 404 for an unknown booking', async () => {
    const res = await api.patch('/api/bookings/64b000000000000000000000/cancel');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
  });

  it('returns 400 for a malformed id', async () => {
    expect((await api.patch('/api/bookings/abc/cancel')).status).toBe(400);
  });
});
