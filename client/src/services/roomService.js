import { api } from './api.js';

/** GET /api/rooms/categories — the category list is owned by the backend. */
export async function getCategories() {
  const { data } = await api.get('/rooms/categories');
  return data;
}

/** GET /api/health */
export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}
