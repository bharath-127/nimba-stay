import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createBookingSchema, bookingIdParamsSchema, listBookingsQuerySchema } from '../validators/schemas.js';
import { postBooking, getBookings, patchCancelBooking } from '../controllers/bookingController.js';

const router = Router();

// GET  /api/bookings?limit=20
router.get('/', validate({ query: listBookingsQuerySchema }), getBookings);
// POST /api/bookings
router.post('/', validate({ body: createBookingSchema }), postBooking);
// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', validate({ params: bookingIdParamsSchema }), patchCancelBooking);

export default router;
