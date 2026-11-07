import { countNights } from './dates.js';

/**
 * Client-side validation for immediate feedback only. The server validates
 * every request independently and is the authority — these rules mirror it
 * so the user sees the same message before and after submitting.
 */

export const PHONE_REGEX = /^\d{10}$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_STAY_NIGHTS = 90;

export function validateSearch({ checkIn, checkOut }) {
  const errors = {};
  if (!checkIn || !ISO_DATE_REGEX.test(checkIn)) errors.checkIn = 'Select a check-in date';
  if (!checkOut || !ISO_DATE_REGEX.test(checkOut)) errors.checkOut = 'Select a check-out date';
  if (!errors.checkIn && !errors.checkOut) {
    const nights = countNights(checkIn, checkOut);
    if (nights <= 0) errors.checkOut = 'Check-out date must be after check-in date';
    else if (nights > MAX_STAY_NIGHTS) errors.checkOut = `A stay cannot exceed ${MAX_STAY_NIGHTS} nights`;
  }
  return errors;
}

export function validateGuest({ guestName, phone }) {
  const errors = {};
  const name = (guestName ?? '').trim();
  if (name.length < 2) errors.guestName = 'Enter the guest\'s full name (at least 2 characters)';
  else if (name.length > 80) errors.guestName = 'Guest name must be at most 80 characters';

  const digits = (phone ?? '').trim();
  if (!digits) errors.phone = 'Enter the guest\'s mobile number';
  else if (!PHONE_REGEX.test(digits)) errors.phone = 'Mobile number must be exactly 10 digits';
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
