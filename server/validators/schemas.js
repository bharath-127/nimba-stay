import { z } from 'zod';
import { isValidIsoDate, countNights } from '../utils/dates.js';
import { ROOM_CATEGORIES, MAX_STAY_NIGHTS, PHONE_REGEX, OBJECT_ID_REGEX } from '../utils/constants.js';

const isoDate = (label) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .refine(isValidIsoDate, { message: `${label} must be a valid date in YYYY-MM-DD format` });

/** Shared cross-field rule: check-out strictly after check-in, stay bounded. */
function validateDateRange(data, ctx) {
  const { checkIn, checkOut } = data;
  if (!isValidIsoDate(checkIn) || !isValidIsoDate(checkOut)) return; // field-level errors already reported
  const nights = countNights(checkIn, checkOut);
  if (nights <= 0) {
    ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Check-out date must be after check-in date' });
  } else if (nights > MAX_STAY_NIGHTS) {
    ctx.addIssue({ code: 'custom', path: ['checkOut'], message: `A stay cannot exceed ${MAX_STAY_NIGHTS} nights` });
  }
}

export const objectIdSchema = z
  .string({ error: 'id is required' })
  .trim()
  .regex(OBJECT_ID_REGEX, 'id must be a valid 24-character identifier');

export const availabilityQuerySchema = z
  .object({
    checkIn: isoDate('checkIn'),
    checkOut: isoDate('checkOut'),
    category: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === '' ? undefined : v))
      .pipe(
        z
          .enum(ROOM_CATEGORIES, { error: `category must be one of: ${ROOM_CATEGORIES.join(', ')}` })
          .optional()
      ),
  })
  .superRefine(validateDateRange);

export const createBookingSchema = z
  .object({
    roomId: z
      .string({ error: 'roomId is required' })
      .trim()
      .regex(OBJECT_ID_REGEX, 'roomId must be a valid room identifier'),
    guestName: z
      .string({ error: 'Guest name is required' })
      .trim()
      .min(2, 'Guest name must be at least 2 characters')
      .max(80, 'Guest name must be at most 80 characters'),
    phone: z.preprocess(
      (v) => (typeof v === 'number' ? String(v) : v),
      z
        .string({ error: 'Phone number is required' })
        .trim()
        .regex(PHONE_REGEX, 'Phone number must be exactly 10 digits')
    ),
    checkIn: isoDate('checkIn'),
    checkOut: isoDate('checkOut'),
  })
  .superRefine(validateDateRange);

export const bookingIdParamsSchema = z.object({ id: objectIdSchema });

export const listBookingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
