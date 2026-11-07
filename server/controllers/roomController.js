import { ROOM_CATEGORIES } from '../utils/constants.js';

export function getCategories(_req, res) {
  res.json({ success: true, data: ROOM_CATEGORIES });
}
