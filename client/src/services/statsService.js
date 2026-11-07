import { api } from './api.js';

/**
 * GET /api/stats?date=YYYY-MM-DD
 * The browser's local date is sent so "tonight" means the front desk's
 * tonight, not the server's.
 */
export async function getStats({ date } = {}) {
  const { data } = await api.get('/stats', { params: date ? { date } : {} });
  return data;
}
