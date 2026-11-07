import { createBooking, cancelBooking, checkOutBooking, listBookings } from '../services/bookingService.js';

export async function postBooking(req, res) {
  const booking = await createBooking(req.validated.body);
  res.status(201).json({ success: true, data: booking });
}

export async function getBookings(req, res) {
  const bookings = await listBookings(req.validated.query);
  res.json({ success: true, data: bookings });
}

export async function patchCancelBooking(req, res) {
  const booking = await cancelBooking(req.validated.params.id);
  res.json({ success: true, data: booking });
}

export async function patchCheckOutBooking(req, res) {
  const booking = await checkOutBooking(req.validated.params.id, req.validated.body ?? {});
  res.json({ success: true, data: booking });
}
