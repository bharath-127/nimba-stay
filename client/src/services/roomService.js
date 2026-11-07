import { api } from './api.js';

/** GET /api/rooms/categories — active room types with rates, cheapest first. */
export async function getCategories() {
  const { data } = await api.get('/rooms/categories');
  return data;
}

/** GET /api/rooms — every room with its rate, beds and active flag. */
export async function getRooms() {
  const { data } = await api.get('/rooms');
  return data;
}

/** GET /api/rooms/blocks — blocks in effect or upcoming. */
export async function getBlocks({ includeEnded = false } = {}) {
  const { data } = await api.get('/rooms/blocks', { params: includeEnded ? { includeEnded: 'true' } : {} });
  return data;
}

/** POST /api/rooms/:id/blocks — take a room out of service for a period. */
export async function createBlock(roomId, { startDate, endDate, reason }) {
  const { data } = await api.post(`/rooms/${roomId}/blocks`, { startDate, endDate: endDate || null, reason });
  return data;
}

/** DELETE /api/rooms/blocks/:id — lift a block. */
export async function liftBlock(blockId) {
  const { data } = await api.delete(`/rooms/blocks/${blockId}`);
  return data;
}

/** GET /api/health */
export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}
