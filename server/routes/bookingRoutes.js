import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createBookingSchema, bookingIdParamsSchema, listBookingsQuerySchema, checkOutBodySchema } from '../validators/schemas.js';
import { postBooking, getBookings, patchCancelBooking, patchCheckOutBooking } from '../controllers/bookingController.js';

const router = Router();

// GET  /api/bookings?limit=20
router.get('/', validate({ query: listBookingsQuerySchema }), getBookings);
// POST /api/bookings
router.post('/', validate({ body: createBookingSchema }), postBooking);
// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', validate({ params: bookingIdParamsSchema }), patchCancelBooking);
// PATCH /api/bookings/:id/check-out   { date? }  — early departure frees the remaining nights
router.patch('/:id/check-out', validate({ params: bookingIdParamsSchema, body: checkOutBodySchema }), patchCheckOutBooking);

export default router;
