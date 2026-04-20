import { describe, it, expect } from 'vitest';
import { DEFAULT_MENTION_PALETTE } from '../mention-editor';

describe('DEFAULT_MENTION_PALETTE', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(DEFAULT_MENTION_PALETTE)).toBe(true);
    expect(DEFAULT_MENTION_PALETTE.length).toBeGreaterThan(0);
  });

  it('contains only valid hex color strings', () => {
    for (const color of DEFAULT_MENTION_PALETTE) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('contains no duplicates', () => {
    const unique = new Set(DEFAULT_MENTION_PALETTE);
    expect(unique.size).toBe(DEFAULT_MENTION_PALETTE.length);
  });
});
