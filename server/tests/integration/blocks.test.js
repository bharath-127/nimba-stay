import { describe, it, expect } from 'vitest';
import { api, useTestDatabase, roomIdByNumber, book, validBooking, RoomBlock } from '../helpers/setup.js';
import { todayIso, addDays } from '../../utils/dates.js';

useTestDatabase();

const search = (params) => api.get('/api/availability').query(params);
const roomNumbers = (res) => res.body.data.rooms.map((r) => r.roomNumber);
const createBlock = async (roomNumber, body) => api.post(`/api/rooms/${await roomIdByNumber(roomNumber)}/blocks`).send(body);

describe('GET /api/rooms and /api/rooms/categories', () => {
  it('lists every room with its rate, beds and active flag', async () => {
    const res = await api.get('/api/rooms');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.data.find((r) => r.roomNumber === 'STE-402')).toMatchObject({ category: 'Suite', bedCount: 3, isActive: true, pricePerNight: 12000 });
  });

  it('lists active room types with rates, cheapest first', async () => {
    const res = await api.get('/api/rooms/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.map((t) => `${t.name}:${t.pricePerNight}`)).toEqual(['Standard:3500', 'Deluxe:5500', 'Premium:8500', 'Suite:12000']);
  });
});

describe('GET /api/rooms/blocks', () => {
  it('shows the seeded open-ended maintenance block with its room', async () => {
    const res = await api.get('/api/rooms/blocks');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ room: { roomNumber: 'DLX-203', category: 'Deluxe' }, startDate: '2026-01-01', endDate: null, reason: 'Under maintenance' });
  });

  it('hides blocks that have already ended unless asked for', async () => {
    await RoomBlock.create({ roomId: await roomIdByNumber('STD-101'), startDate: '2026-01-01', endDate: '2026-02-01', reason: 'Old' });
    expect((await api.get('/api/rooms/blocks')).body.data).toHaveLength(1);
    expect((await api.get('/api/rooms/blocks').query({ includeEnded: 'true' })).body.data).toHaveLength(2);
  });
});

describe('POST /api/rooms/:id/blocks', () => {
  it('creates a dated block, which hides the room and refuses bookings for that period', async () => {
    const res = await createBlock('STE-401', { startDate: '2026-11-21', endDate: '2026-11-23', reason: 'Plumbing' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ room: { roomNumber: 'STE-401' }, startDate: '2026-11-21', endDate: '2026-11-23', reason: 'Plumbing' });

    expect(roomNumbers(await search({ checkIn: '2026-11-20', checkOut: '2026-11-22', category: 'Suite' }))).toEqual(['STE-402']);
    expect(roomNumbers(await search({ checkIn: '2026-11-23', checkOut: '2026-11-25', category: 'Suite' }))).toEqual(['STE-401', 'STE-402']);

    const booking = await api.post('/api/bookings').send(validBooking({ roomId: await roomIdByNumber('STE-401') }));
    expect(booking.status).toBe(409);
    expect(booking.body.error.code).toBe('ROOM_UNAVAILABLE');
  });

  it('defaults to an open-ended block with the reason "Maintenance"', async () => {
    const res = await createBlock('STE-401', { startDate: '2026-11-21' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ endDate: null, reason: 'Maintenance' });
  });

  it('refuses to block a room that has a confirmed guest in the period, and names them', async () => {
    await book('STE-401'); // 20–23 Nov
    const res = await createBlock('STE-401', { startDate: '2026-11-22', endDate: '2026-11-30' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('BLOCK_CONFLICTS_WITH_BOOKINGS');
    expect(res.body.error.details[0]).toMatchObject({ guestName: 'Asha Mehta', checkIn: '2026-11-20', checkOut: '2026-11-23' });
    expect(await RoomBlock.countDocuments({ roomId: await roomIdByNumber('STE-401') })).toBe(0);
  });

  it('allows a block that starts on the guest\'s check-out day or ends on their check-in day', async () => {
    await book('STE-401'); // 20–23 Nov
    expect((await createBlock('STE-401', { startDate: '2026-11-23', endDate: '2026-11-30' })).status).toBe(201);
    expect((await createBlock('STE-401', { startDate: '2026-11-10', endDate: '2026-11-20' })).status).toBe(201);
  });

  it('allows a block after an early check-out', async () => {
    const stay = await book('STE-401');
    await api.patch(`/api/bookings/${stay.id}/check-out`).send({ date: '2026-11-21' }).expect(200);
    expect((await createBlock('STE-401', { startDate: '2026-11-21', endDate: '2026-11-23' })).status).toBe(201);
    expect((await createBlock('STE-401', { startDate: '2026-11-20', endDate: '2026-11-21' })).status).toBe(409);
  });

  it('validates dates and ids', async () => {
    expect((await createBlock('STE-401', { startDate: '2026-11-23', endDate: '2026-11-21' })).status).toBe(400);
    expect((await createBlock('STE-401', { startDate: '2026-11-23', endDate: '2026-11-23' })).status).toBe(400);
    expect((await createBlock('STE-401', { startDate: 'soon' })).status).toBe(400);
    expect((await createBlock('STE-401', {})).status).toBe(400);
    expect((await api.post('/api/rooms/64b000000000000000000000/blocks').send({ startDate: '2026-11-21' })).status).toBe(404);
    expect((await api.post('/api/rooms/abc/blocks').send({ startDate: '2026-11-21' })).status).toBe(400);
  });
});

describe('DELETE /api/rooms/blocks/:blockId — lifting a block', () => {
  it('removes a block that has not started, making the room available again', async () => {
    const future = addDays(todayIso(), 10);
    const created = await createBlock('STE-401', { startDate: future, endDate: addDays(future, 5) });
    expect(roomNumbers(await search({ checkIn: future, checkOut: addDays(future, 2), category: 'Suite' }))).toEqual(['STE-402']);

    const res = await api.delete(`/api/rooms/blocks/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.lifted).toBe('removed');
    expect(roomNumbers(await search({ checkIn: future, checkOut: addDays(future, 2), category: 'Suite' }))).toEqual(['STE-401', 'STE-402']);
    expect(await RoomBlock.countDocuments({ _id: created.body.data.id })).toBe(0);
  });

  it('ends a block already in effect today, keeping its history', async () => {
    const seeded = (await api.get('/api/rooms/blocks')).body.data[0]; // DLX-203 since 2026-01-01
    const res = await api.delete(`/api/rooms/blocks/${seeded.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ lifted: 'ended-today', endDate: todayIso() });

    expect((await api.get('/api/rooms/blocks')).body.data).toHaveLength(0);
    const future = addDays(todayIso(), 1);
    expect(roomNumbers(await search({ checkIn: future, checkOut: addDays(future, 1), category: 'Deluxe' }))).toContain('DLX-203');
  });

  it('returns 404 for an unknown block and 400 for a malformed id', async () => {
    expect((await api.delete('/api/rooms/blocks/64b000000000000000000000')).status).toBe(404);
    expect((await api.delete('/api/rooms/blocks/abc')).status).toBe(400);
  });
});
