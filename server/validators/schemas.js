import { z } from 'zod';
import { isValidIsoDate, countNights } from '../utils/dates.js';
import { MAX_STAY_NIGHTS, PHONE_REGEX, OBJECT_ID_REGEX } from '../utils/constants.js';

const isoDate = (label) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .refine(isValidIsoDate, { message: `${label} must be a valid date in YYYY-MM-DD format` });

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

/** Shared cross-field rule: check-out strictly after check-in, stay bounded. */
function validateDateRange(data, ctx, startKey = 'checkIn', endKey = 'checkOut') {
  const start = data[startKey];
  const end = data[endKey];
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) return; // field-level errors already reported
  const nights = countNights(start, end);
  if (nights <= 0) {
    ctx.addIssue({ code: 'custom', path: [endKey], message: 'Check-out date must be after check-in date' });
  } else if (nights > MAX_STAY_NIGHTS) {
    ctx.addIssue({ code: 'custom', path: [endKey], message: `A stay cannot exceed ${MAX_STAY_NIGHTS} nights` });
  }
}

export const objectIdSchema = z
  .string({ error: 'id is required' })
  .trim()
  .regex(OBJECT_ID_REGEX, 'id must be a valid 24-character identifier');

// Category is checked against the live RoomType list in the service.
export const availabilityQuerySchema = z
  .object({
    checkIn: isoDate('checkIn'),
    checkOut: isoDate('checkOut'),
    category: optionalText,
  })
  .superRefine((d, ctx) => validateDateRange(d, ctx));

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
  .superRefine((d, ctx) => validateDateRange(d, ctx));

export const bookingIdParamsSchema = z.object({ id: objectIdSchema });

export const checkOutBodySchema = z.object({
  date: isoDate('date').optional(),
});

export const listBookingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Stats for a stay range, or for one night (`date`), or tonight when empty. */
export const statsQuerySchema = z
  .object({
    checkIn: isoDate('checkIn').optional(),
    checkOut: isoDate('checkOut').optional(),
    date: isoDate('date').optional(),
  })
  .superRefine((d, ctx) => {
    if ((d.checkIn && !d.checkOut) || (!d.checkIn && d.checkOut)) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'checkIn and checkOut must be given together' });
      return;
    }
    if (d.checkIn && d.checkOut) validateDateRange(d, ctx);
  });

export const roomIdParamsSchema = z.object({ id: objectIdSchema });
export const blockIdParamsSchema = z.object({ blockId: objectIdSchema });

export const createBlockSchema = z
  .object({
    startDate: isoDate('startDate'),
    endDate: z.preprocess((v) => (v === '' || v === undefined ? null : v), isoDate('endDate').nullable()),
    reason: z.string().trim().max(200, 'Reason must be at most 200 characters').optional().default('Maintenance'),
  })
  .superRefine((d, ctx) => {
    if (d.endDate && isValidIsoDate(d.startDate) && !(d.endDate > d.startDate)) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after start date' });
    }
  });

export const listBlocksQuerySchema = z.object({
  includeEnded: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});
