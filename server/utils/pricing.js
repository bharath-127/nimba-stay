import { MIN_CHARGED_NIGHTS } from './constants.js';

/**
 * Pricing of a stay. The server is the only place this is computed:
 * the client never supplies a price (business rule 9).
 */

/**
 * Nights billed: the actual nights, but never fewer than the minimum.
 * With MIN_CHARGED_NIGHTS = 1 (the current setting) this is simply `nights`.
 */
export function chargedNightsFor(nights, minimum = MIN_CHARGED_NIGHTS) {
  if (!Number.isInteger(nights) || nights <= 0) {
    throw new Error(`nights must be a positive integer, received ${nights}`);
  }
  return Math.max(nights, minimum);
}

export function calculateTotalPrice(chargedNights, pricePerNight) {
  if (!Number.isInteger(chargedNights) || chargedNights <= 0) {
    throw new Error(`chargedNights must be a positive integer, received ${chargedNights}`);
  }
  if (typeof pricePerNight !== 'number' || Number.isNaN(pricePerNight) || pricePerNight < 0) {
    throw new Error(`pricePerNight must be a non-negative number, received ${pricePerNight}`);
  }
  return Math.round(chargedNights * pricePerNight * 100) / 100;
}

/** `{ nights, chargedNights, pricePerNight, totalPrice }` for a stay of `nights` at `pricePerNight`. */
export function priceStay(nights, pricePerNight) {
  const chargedNights = chargedNightsFor(nights);
  return { nights, chargedNights, pricePerNight, totalPrice: calculateTotalPrice(chargedNights, pricePerNight) };
}
