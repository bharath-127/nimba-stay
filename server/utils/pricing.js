/**
 * Total price of a stay. The server is the only place this is computed:
 * the client never supplies a price (business rule 9).
 */
export function calculateTotalPrice(nights, pricePerNight) {
  if (!Number.isInteger(nights) || nights <= 0) {
    throw new Error(`nights must be a positive integer, received ${nights}`);
  }
  if (typeof pricePerNight !== 'number' || Number.isNaN(pricePerNight) || pricePerNight < 0) {
    throw new Error(`pricePerNight must be a non-negative number, received ${pricePerNight}`);
  }
  return Math.round(nights * pricePerNight * 100) / 100;
}
