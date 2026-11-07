import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { availabilityQuerySchema } from '../validators/schemas.js';
import { getAvailability } from '../controllers/availabilityController.js';

const router = Router();

// GET /api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&category=Deluxe
router.get('/', validate({ query: availabilityQuerySchema }), getAvailability);

export default router;
