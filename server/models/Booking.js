import mongoose from 'mongoose';
import { BOOKING_STATUS, PHONE_REGEX } from '../utils/constants.js';
import { ISO_DATE_REGEX } from '../utils/dates.js';

const bookingSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    guestName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    phone: { type: String, required: true, trim: true, match: PHONE_REGEX },
    // Calendar dates as ISO strings — see utils/dates.js for why.
    checkIn: { type: String, required: true, match: ISO_DATE_REGEX },
    checkOut: { type: String, required: true, match: ISO_DATE_REGEX },
    nights: { type: Number, required: true, min: 1 },
    // Nights actually billed — never below MIN_CHARGED_NIGHTS.
    chargedNights: { type: Number, required: true, min: 1 },
    // Snapshot of the rate at booking time, so later tariff changes
    // never silently alter an existing booking's total.
    pricePerNight: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.CONFIRMED,
    },
    // Set when the guest leaves before checkOut; the room is free from this day.
    checkedOutOn: { type: String, default: null, match: ISO_DATE_REGEX },
    checkedOutAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Defence in depth: the API layer validates this first, but the model refuses
// an inverted range too. (Mongoose 9 middleware has no `next` callback —
// hooks are sync/async functions; `invalidate` yields a ValidationError.)
bookingSchema.pre('validate', function enforceDateOrder() {
  if (this.checkIn && this.checkOut && !(this.checkOut > this.checkIn)) {
    this.invalidate('checkOut', 'checkOut must be after checkIn');
  }
});

// Supports the availability overlap queries on confirmed and checked-out stays.
bookingSchema.index({ roomId: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ roomId: 1, status: 1, checkIn: 1, checkedOutOn: 1 });
bookingSchema.index({ createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);
