import { describe, it, expect } from 'vitest';
import { areaSqFt } from './roomMeta.js';

describe('areaSqFt', () => {
  it('returns the published size for each seeded category', () => {
    expect(areaSqFt('Standard')).toBe(200);
    expect(areaSqFt('Deluxe')).toBe(250);
    expect(areaSqFt('Premium')).toBe(300);
    expect(areaSqFt('Suite')).toBe(860);
  });

  it('returns null for an unknown or missing category so the UI can omit it', () => {
    expect(areaSqFt('Penthouse')).toBeNull();
    expect(areaSqFt(undefined)).toBeNull();
  });
});
