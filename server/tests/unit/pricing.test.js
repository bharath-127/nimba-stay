import { describe, it, expect } from 'vitest';
import { chargedNightsFor, calculateTotalPrice, priceStay } from '../../utils/pricing.js';
import { MIN_CHARGED_NIGHTS } from '../../utils/constants.js';

describe('chargedNightsFor — minimum charged nights', () => {
  it(`charges at least ${MIN_CHARGED_NIGHTS} nights`, () => {
    expect(chargedNightsFor(1)).toBe(MIN_CHARGED_NIGHTS);
    expect(chargedNightsFor(2)).toBe(MIN_CHARGED_NIGHTS);
    expect(chargedNightsFor(3)).toBe(3);
  });

  it('charges the actual nights above the minimum', () => {
    expect(chargedNightsFor(4)).toBe(4);
    expect(chargedNightsFor(30)).toBe(30);
  });

  it('rejects zero, negative or fractional nights', () => {
    expect(() => chargedNightsFor(0)).toThrow();
    expect(() => chargedNightsFor(-1)).toThrow();
    expect(() => chargedNightsFor(1.5)).toThrow();
  });
});

describe('calculateTotalPrice', () => {
  it('multiplies charged nights by the nightly rate', () => {
    expect(calculateTotalPrice(3, 5500)).toBe(16500);
    expect(calculateTotalPrice(7, 12000)).toBe(84000);
  });

  it('rounds to two decimals', () => {
    expect(calculateTotalPrice(3, 1999.99)).toBe(5999.97);
  });

  it('rejects an invalid rate', () => {
    expect(() => calculateTotalPrice(2, -1)).toThrow();
    expect(() => calculateTotalPrice(2, NaN)).toThrow();
    expect(() => calculateTotalPrice(2, '5500')).toThrow();
  });
});

describe('priceStay', () => {
  it('prices a short stay at the minimum', () => {
    expect(priceStay(1, 5500)).toEqual({ nights: 1, chargedNights: 3, pricePerNight: 5500, totalPrice: 16500 });
  });

  it('prices a long stay at its real length', () => {
    expect(priceStay(5, 3500)).toEqual({ nights: 5, chargedNights: 5, pricePerNight: 3500, totalPrice: 17500 });
  });
});
