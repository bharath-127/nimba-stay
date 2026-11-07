import { describe, it, expect } from 'vitest';
import { api, useTestDatabase, book, blockRoom, Room } from '../helpers/setup.js';
import { todayIso, addDays } from '../../utils/dates.js';

useTestDatabase();

const RANGE = { checkIn: '2026-11-20', checkOut: '2026-11-23' };
const stats = (query = RANGE) => api.get('/api/stats').query(query);

describe('GET /api/stats — summary for the selected dates', () => {
  it('summarises the seeded rooms for a stay range', async () => {
    const res = await stats();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      checkIn: '2026-11-20',
      checkOut: '2026-11-23',
      nights: 3,
      totalRooms: 10,
      activeRooms: 10,
      inactiveRooms: 0,
      maintenanceRooms: 1,
      availableRooms: 9,
      occupiedRooms: 0,
      confirmedBookings: 0,
      currentOrUpcomingBookings: 0,
      inHouseTonight: 0,
    });
  });

  it('a stay inside the range reduces availability and counts as occupied', async () => {
    await book('DLX-201', { checkIn: '2026-11-21', checkOut: '2026-11-22' });
    const { data } = (await stats()).body;
    expect(data).toMatchObject({ availableRooms: 8, occupiedRooms: 1, confirmedBookings: 1, currentOrUpcomingBookings: 1 });
  });

  it('changes with the dates: the same booking is invisible to a range it does not touch', async () => {
    await book('DLX-201'); // 20–23
    expect((await stats({ checkIn: '2026-11-20', checkOut: '2026-11-23' })).body.data.availableRooms).toBe(8);
    expect((await stats({ checkIn: '2026-11-23', checkOut: '2026-11-25' })).body.data.availableRooms).toBe(9); // RULE 1
    expect((await stats({ checkIn: '2026-11-18', checkOut: '2026-11-20' })).body.data.availableRooms).toBe(9); // RULE 1
    expect((await stats({ checkIn: '2026-11-18', checkOut: '2026-11-21' })).body.data.availableRooms).toBe(8);
  });

  it('RULE 2: cancelling releases the room and drops the confirmed count', async () => {
    const stay = await book('STE-401');
    expect((await stats()).body.data.availableRooms).toBe(8);
    await api.patch(`/api/bookings/${stay.id}/cancel`).expect(200);
    expect((await stats()).body.data).toMatchObject({ availableRooms: 9, confirmedBookings: 0 });
  });

  it('an early check-out frees the room for the remaining nights', async () => {
    const stay = await book('STE-401'); // 20–23
    await api.patch(`/api/bookings/${stay.id}/check-out`).send({ date: '2026-11-21' }).expect(200);
    expect((await stats({ checkIn: '2026-11-21', checkOut: '2026-11-23' })).body.data.availableRooms).toBe(9);
    expect((await stats({ checkIn: '2026-11-20', checkOut: '2026-11-21' })).body.data.availableRooms).toBe(8);
    expect((await stats()).body.data.confirmedBookings).toBe(0); // checked out is not confirmed
  });

  it('RULE 3: a block overlapping the range counts as maintenance and is not available', async () => {
    await blockRoom('PRM-301', '2026-11-22', '2026-11-25');
    const { data } = (await stats()).body;
    expect(data).toMatchObject({ maintenanceRooms: 2, availableRooms: 8, occupiedRooms: 0 });
  });

  it('a block outside the range is not counted for it', async () => {
    await blockRoom('PRM-301', '2026-11-23', '2026-11-25');
    expect((await stats()).body.data).toMatchObject({ maintenanceRooms: 1, availableRooms: 9 });
  });

  it('an inactive room leaves service entirely', async () => {
    await Room.updateOne({ roomNumber: 'PRM-301' }, { isActive: false });
    expect((await stats()).body.data).toMatchObject({ totalRooms: 10, activeRooms: 9, inactiveRooms: 1, availableRooms: 8, maintenanceRooms: 1 });
  });

  it('accepts a single date as a one-night range, and defaults to tonight', async () => {
    const single = await stats({ date: '2026-11-20' });
    expect(single.body.data).toMatchObject({ checkIn: '2026-11-20', checkOut: '2026-11-21', nights: 1 });

    const today = todayIso();
    const none = await stats({});
    expect(none.body.data).toMatchObject({ checkIn: today, checkOut: addDays(today, 1), nights: 1 });
  });

  it('counts guests in house tonight independently of the selected range', async () => {
    const today = todayIso();
    await book('STD-101', { checkIn: addDays(today, -1), checkOut: addDays(today, 2) });
    const { data } = (await stats({ checkIn: '2027-01-10', checkOut: '2027-01-12' })).body;
    expect(data.inHouseTonight).toBe(1);
    expect(data.availableRooms).toBe(9);
  });

  it('rejects a half-given or inverted range and invalid dates with 400', async () => {
    expect((await stats({ checkIn: '2026-11-20' })).status).toBe(400);
    expect((await stats({ checkOut: '2026-11-20' })).status).toBe(400);
    expect((await stats({ checkIn: '2026-11-22', checkOut: '2026-11-20' })).status).toBe(400);
    expect((await stats({ date: '2026-02-30' })).status).toBe(400);
    expect((await stats({ date: 'today' })).status).toBe(400);
  });
});
