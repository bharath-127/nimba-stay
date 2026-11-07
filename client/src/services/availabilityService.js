import { api } from './api.js';

/**
 * GET /api/availability?checkIn=&checkOut=&category=
 * Resolves to `{ checkIn, checkOut, nights, category, count, rooms[] }`.
 */
export async function getAvailability({ checkIn, checkOut, category }) {
  const params = { checkIn, checkOut };
  if (category) params.category = category;
  const { data } = await api.get('/availability', { params });
  return data;
}
