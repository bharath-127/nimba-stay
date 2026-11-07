import { findAvailableRooms } from '../services/availabilityService.js';

export async function getAvailability(req, res) {
  const data = await findAvailableRooms(req.validated.query);
  res.json({ success: true, data });
}
