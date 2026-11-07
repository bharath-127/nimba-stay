import { api } from './api.js';

/** POST /api/bookings — the server computes the price; we never send one. */
export async function createBooking({ roomId, guestName, phone, checkIn, checkOut }) {
  const { data } = await api.post('/bookings', { roomId, guestName, phone, checkIn, checkOut });
  return data;
}

/** GET /api/bookings?limit= */
export async function getBookings({ limit = 10 } = {}) {
  const { data } = await api.get('/bookings', { params: { limit } });
  return data;
}

/** PATCH /api/bookings/:id/cancel */
export async function cancelBooking(id) {
  const { data } = await api.patch(`/bookings/${id}/cancel`);
  return data;
}

/** PATCH /api/bookings/:id/check-out — early departure frees the remaining nights. */
export async function checkOutBooking(id, { date } = {}) {
  const { data } = await api.patch(`/bookings/${id}/check-out`, date ? { date } : {});
  return data;
}
