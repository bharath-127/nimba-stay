import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { statsQuerySchema } from '../validators/schemas.js';
import { getStats } from '../controllers/statsController.js';

const router = Router();

// GET /api/stats?date=YYYY-MM-DD   (date optional — defaults to today)
router.get('/', validate({ query: statsQuerySchema }), getStats);

export default router;
