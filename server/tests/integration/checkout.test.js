import { describe, it, expect, beforeEach } from 'vitest';
import { api, useTestDatabase, book, validBooking, roomIdByNumber, Booking, RoomNight } from '../helpers/setup.js';
import { todayIso, addDays } from '../../utils/dates.js';

useTestDatabase();

const checkOut = (id, body) => api.patch(`/api/bookings/${id}/check-out`).send(body ?? {});

describe('PATCH /api/bookings/:id/check-out — early departure frees the remaining nights', () => {
  let booking;

  beforeEach(async () => {
    booking = await book('DLX-201'); // nights 20, 21, 22
  });

  it('leaving early marks the booking checked out and releases the nights from that day', async () => {
    const res = await checkOut(booking.id, { date: '2026-11-21' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: booking.id, status: 'checked_out', checkedOutOn: '2026-11-21' });
    expect(res.body.data.checkedOutAt).toBeTruthy();

    const nights = await RoomNight.find({ bookingId: booking.id }).lean();
    expect(nights.map((n) => n.date)).toEqual(['2026-11-20']); // the night already stayed is kept

    const stored = await Booking.findById(booking.id).lean();
    expect(stored.status).toBe('checked_out');
    expect(stored.totalPrice).toBe(booking.totalPrice); // the bill is not recalculated here
  });

  it('the room can be re-let from the departure day, but not before', async () => {
    await checkOut(booking.id, { date: '2026-11-21' }).expect(200);
    const next = await api.post('/api/bookings').send(validBooking({ roomId: booking.roomId, guestName: 'Next', checkIn: '2026-11-21', checkOut: '2026-11-23' }));
    expect(next.status).toBe(201);
    const early = await api.post('/api/bookings').send(validBooking({ roomId: booking.roomId, guestName: 'Early', checkIn: '2026-11-20', checkOut: '2026-11-21' }));
    expect(early.status).toBe(409);
  });

  it('leaving on or after the planned check-out day frees nothing extra', async () => {
    const res = await checkOut(booking.id, { date: '2026-11-25' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'checked_out', checkedOutOn: '2026-11-23' });
    expect(await RoomNight.countDocuments({ bookingId: booking.id })).toBe(3);
  });

  it('defaults the departure day to today', async () => {
    const today = todayIso();
    const current = await book('STE-401', { checkIn: today, checkOut: addDays(today, 3) });
    const res = await checkOut(current.id);
    expect(res.status).toBe(200);
    expect(res.body.data.checkedOutOn).toBe(today);
    expect(await RoomNight.countDocuments({ bookingId: current.id })).toBe(0);
  });

  it('refuses to check out a stay that has not started', async () => {
    const res = await checkOut(booking.id, { date: '2026-11-19' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('BOOKING_NOT_STARTED');
    expect(await RoomNight.countDocuments({ bookingId: booking.id })).toBe(3);
  });

  it('refuses to check out a cancelled booking', async () => {
    await api.patch(`/api/bookings/${booking.id}/cancel`).expect(200);
    const res = await checkOut(booking.id, { date: '2026-11-21' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('BOOKING_CANCELLED');
  });

  it('is idempotent', async () => {
    await checkOut(booking.id, { date: '2026-11-21' }).expect(200);
    const again = await checkOut(booking.id, { date: '2026-11-22' });
    expect(again.status).toBe(200);
    expect(again.body.data.checkedOutOn).toBe('2026-11-21'); // the first departure stands
  });

  it('validates the id and the date', async () => {
    expect((await checkOut('64b000000000000000000000', { date: '2026-11-21' })).status).toBe(404);
    expect((await checkOut('abc', { date: '2026-11-21' })).status).toBe(400);
    expect((await checkOut(booking.id, { date: 'yesterday' })).status).toBe(400);
  });
});
