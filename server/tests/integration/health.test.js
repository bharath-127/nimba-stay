import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { api, useTestDatabase } from '../helpers/setup.js';
import { env } from '../../config/env.js';
import { connectDB } from '../../config/db.js';

useTestDatabase();

describe('GET /api/health', () => {
  it('returns 200 with the database connected', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'connected' });
    expect(['enabled', 'fallback']).toContain(res.body.data.transactions);
  });

  it('returns 503 DATABASE_UNAVAILABLE when MongoDB is not reachable', async () => {
    await mongoose.disconnect();
    try {
      const res = await api.get('/api/health');
      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: expect.any(String) },
      });
    } finally {
      await connectDB(env.mongoUri);
    }
  });
});
