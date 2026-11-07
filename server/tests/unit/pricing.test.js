import { describe, it, expect } from 'vitest';
import { calculateTotalPrice } from '../../utils/pricing.js';

describe('calculateTotalPrice', () => {
  it('multiplies nights by the nightly rate', () => {
    expect(calculateTotalPrice(1, 5500)).toBe(5500);
    expect(calculateTotalPrice(3, 5500)).toBe(16500);
    expect(calculateTotalPrice(7, 12000)).toBe(84000);
  });

  it('rounds to two decimals', () => {
    expect(calculateTotalPrice(3, 1999.99)).toBe(5999.97);
  });

  it('rejects zero or negative nights', () => {
    expect(() => calculateTotalPrice(0, 5500)).toThrow();
    expect(() => calculateTotalPrice(-1, 5500)).toThrow();
    expect(() => calculateTotalPrice(1.5, 5500)).toThrow();
  });

  it('rejects an invalid rate', () => {
    expect(() => calculateTotalPrice(2, -1)).toThrow();
    expect(() => calculateTotalPrice(2, NaN)).toThrow();
    expect(() => calculateTotalPrice(2, '5500')).toThrow();
  });
});
