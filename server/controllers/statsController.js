import { getDashboardStats } from '../services/statsService.js';

export async function getStats(req, res) {
  const data = await getDashboardStats(req.validated.query);
  res.json({ success: true, data });
}
