import { describe, it, expect } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, validBooking } from '../helpers/setup.js';

useTestDatabase();

const DAY = '2026-11-20';
const stats = (date = DAY) => api.get('/api/stats').query(date ? { date } : {});
const book = async (roomNumber, checkIn, checkOut) => {
  const res = await api.post('/api/bookings').send(validBooking({ roomId: await roomIdByNumber(roomNumber), checkIn, checkOut }));
  expect(res.status).toBe(201);
  return res.body.data;
};

describe('GET /api/stats', () => {
  it('summarises the seeded rooms from the database', async () => {
    const res = await stats();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      date: DAY,
      totalRooms: 10,
      activeRooms: 9,
      maintenanceRooms: 1,
      availableTonight: 9,
      occupiedTonight: 0,
      confirmedBookings: 0,
      currentOrUpcomingBookings: 0,
    });
  });

  it('a stay covering tonight reduces availability and counts as a confirmed booking', async () => {
    await book('DLX-201', '2026-11-20', '2026-11-22');
    const { data } = (await stats()).body;
    expect(data.availableTonight).toBe(8);
    expect(data.occupiedTonight).toBe(1);
    expect(data.confirmedBookings).toBe(1);
    expect(data.currentOrUpcomingBookings).toBe(1);
  });

  it('RULE 1: a guest checking out today does not occupy tonight', async () => {
    await book('DLX-201', '2026-11-18', '2026-11-20');
    const { data } = (await stats()).body;
    expect(data.availableTonight).toBe(9);
    expect(data.confirmedBookings).toBe(1);
    expect(data.currentOrUpcomingBookings).toBe(0);
  });

  it('RULE 2: cancelling releases the night and drops the confirmed count', async () => {
    const booking = await book('STE-401', '2026-11-19', '2026-11-23');
    expect((await stats()).body.data.availableTonight).toBe(8);

    await api.patch(`/api/bookings/${booking.id}/cancel`).expect(200);

    const { data } = (await stats()).body;
    expect(data.availableTonight).toBe(9);
    expect(data.confirmedBookings).toBe(0);
  });

  it('RULE 3: a room put under maintenance leaves available and joins maintenance', async () => {
    const { Room } = await import('../helpers/setup.js');
    await Room.updateOne({ roomNumber: 'PRM-301' }, { status: 'maintenance' });
    const { data } = (await stats()).body;
    expect(data.maintenanceRooms).toBe(2);
    expect(data.activeRooms).toBe(8);
    expect(data.availableTonight).toBe(8);
  });

  it('defaults to today when no date is given', async () => {
    const res = await stats(null);
    expect(res.status).toBe(200);
    expect(res.body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects an invalid date with 400', async () => {
    expect((await stats('2026-02-30')).status).toBe(400);
    expect((await stats('today')).status).toBe(400);
  });
});
