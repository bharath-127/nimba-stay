import { describe, it, expect } from 'vitest';
import { validateSearch, validateGuest, hasErrors } from './validation.js';

describe('validateSearch', () => {
  it('accepts a valid range', () => {
    expect(validateSearch({ checkIn: '2026-11-20', checkOut: '2026-11-22' })).toEqual({});
  });

  it('rejects same-day check-out', () => {
    const errors = validateSearch({ checkIn: '2026-11-20', checkOut: '2026-11-20' });
    expect(errors.checkOut).toMatch(/after check-in/i);
  });

  it('rejects check-out before check-in', () => {
    expect(validateSearch({ checkIn: '2026-11-22', checkOut: '2026-11-20' }).checkOut).toBeTruthy();
  });

  it('rejects missing dates', () => {
    const errors = validateSearch({ checkIn: '', checkOut: '' });
    expect(errors.checkIn).toBeTruthy();
    expect(errors.checkOut).toBeTruthy();
  });

  it('rejects stays over 90 nights', () => {
    expect(validateSearch({ checkIn: '2026-01-01', checkOut: '2026-06-01' }).checkOut).toMatch(/90 nights/);
  });
});

describe('validateGuest', () => {
  it('accepts a valid guest', () => {
    expect(validateGuest({ guestName: 'Asha Mehta', phone: '9876543210' })).toEqual({});
  });

  it.each([
    ['9 digits', '987654321'],
    ['11 digits', '98765432101'],
    ['letters', '98765abcde'],
    ['spaces', '98765 43210'],
    ['empty', ''],
  ])('rejects a phone with %s', (_label, phone) => {
    expect(validateGuest({ guestName: 'Asha Mehta', phone }).phone).toBeTruthy();
  });

  it('rejects a short or blank name', () => {
    expect(validateGuest({ guestName: 'A', phone: '9876543210' }).guestName).toBeTruthy();
    expect(validateGuest({ guestName: '   ', phone: '9876543210' }).guestName).toBeTruthy();
  });

  it('hasErrors reflects the result', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ phone: 'x' })).toBe(true);
  });
});
