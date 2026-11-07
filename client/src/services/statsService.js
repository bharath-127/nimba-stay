import { api } from './api.js';

/**
 * GET /api/stats?checkIn=&checkOut=
 * With a range the summary describes those dates; without one, tonight.
 */
export async function getStats({ checkIn, checkOut } = {}) {
  const params = checkIn && checkOut ? { checkIn, checkOut } : {};
  const { data } = await api.get('/stats', { params });
  return data;
}
