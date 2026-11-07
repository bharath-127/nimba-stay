import { describe, it, expect } from 'vitest';
import {
  isValidIsoDate,
  addDays,
  countNights,
  nightsBetween,
  rangesOverlap,
} from '../../utils/dates.js';

describe('isValidIsoDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidIsoDate('2026-11-20')).toBe(true);
    expect(isValidIsoDate('2028-02-29')).toBe(true); // leap year
  });

  it('rejects malformed or impossible dates', () => {
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2027-02-29')).toBe(false); // not a leap year
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('20-11-2026')).toBe(false);
    expect(isValidIsoDate('2026/11/20')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate(undefined)).toBe(false);
    expect(isValidIsoDate(20261120)).toBe(false);
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('countNights', () => {
  it('counts nights in a half-open range', () => {
    expect(countNights('2026-11-20', '2026-11-21')).toBe(1);
    expect(countNights('2026-11-20', '2026-11-23')).toBe(3);
    expect(countNights('2026-11-28', '2026-12-02')).toBe(4);
  });

  it('is zero or negative for an invalid range', () => {
    expect(countNights('2026-11-20', '2026-11-20')).toBe(0);
    expect(countNights('2026-11-21', '2026-11-20')).toBe(-1);
  });
});

describe('nightsBetween', () => {
  it('lists every occupied night and EXCLUDES the check-out day', () => {
    expect(nightsBetween('2026-11-17', '2026-11-20')).toEqual(['2026-11-17', '2026-11-18', '2026-11-19']);
  });

  it('returns a single night for a one-night stay', () => {
    expect(nightsBetween('2026-11-20', '2026-11-21')).toEqual(['2026-11-20']);
  });

  it('returns nothing for an empty or inverted range', () => {
    expect(nightsBetween('2026-11-20', '2026-11-20')).toEqual([]);
    expect(nightsBetween('2026-11-21', '2026-11-20')).toEqual([]);
  });

  it('spans a month boundary correctly', () => {
    expect(nightsBetween('2026-11-29', '2026-12-02')).toEqual(['2026-11-29', '2026-11-30', '2026-12-01']);
  });
});

describe('rangesOverlap — existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn', () => {
  const existing = ['2026-11-20', '2026-11-23']; // nights 20, 21, 22

  it('RULE 1: a guest leaving on the 23rd does not block a guest arriving on the 23rd', () => {
    expect(rangesOverlap(...existing, '2026-11-23', '2026-11-25')).toBe(false);
  });

  it('RULE 1 (mirror): a guest leaving on the 20th does not block a guest arriving on the 20th', () => {
    expect(rangesOverlap(...existing, '2026-11-18', '2026-11-20')).toBe(false);
  });

  it('identical range overlaps', () => {
    expect(rangesOverlap(...existing, '2026-11-20', '2026-11-23')).toBe(true);
  });

  it('partial overlap at the end overlaps', () => {
    expect(rangesOverlap(...existing, '2026-11-22', '2026-11-25')).toBe(true);
  });

  it('partial overlap at the start overlaps', () => {
    expect(rangesOverlap(...existing, '2026-11-18', '2026-11-21')).toBe(true);
  });

  it('a request inside the existing stay overlaps', () => {
    expect(rangesOverlap(...existing, '2026-11-21', '2026-11-22')).toBe(true);
  });

  it('a request containing the existing stay overlaps', () => {
    expect(rangesOverlap(...existing, '2026-11-18', '2026-11-26')).toBe(true);
  });

  it('a request entirely before or after does not overlap', () => {
    expect(rangesOverlap(...existing, '2026-11-10', '2026-11-15')).toBe(false);
    expect(rangesOverlap(...existing, '2026-12-01', '2026-12-05')).toBe(false);
  });

  it('agrees with night-set intersection for many random ranges', () => {
    // The availability query uses the overlap predicate; the write guard uses
    // night-level uniqueness. They must be the same rule. Prove it.
    let seed = 42;
    const rand = (n) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    for (let i = 0; i < 2000; i += 1) {
      const aIn = addDays('2026-11-01', rand(30));
      const aOut = addDays(aIn, 1 + rand(7));
      const bIn = addDays('2026-11-01', rand(30));
      const bOut = addDays(bIn, 1 + rand(7));
      const aNights = new Set(nightsBetween(aIn, aOut));
      const intersects = nightsBetween(bIn, bOut).some((n) => aNights.has(n));
      expect(rangesOverlap(aIn, aOut, bIn, bOut), `${aIn}..${aOut} vs ${bIn}..${bOut}`).toBe(intersects);
    }
  });
});
