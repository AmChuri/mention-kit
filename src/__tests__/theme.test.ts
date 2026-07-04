import { describe, it, expect } from 'vitest';
import { resolveThemeVars, applyTheme } from '../theme';

// ─── resolveThemeVars ─────────────────────────────────────────────────────────

describe('resolveThemeVars', () => {
  it('returns an empty map for no theme', () => {
    expect(resolveThemeVars()).toEqual({});
    expect(resolveThemeVars({})).toEqual({});
  });

  it('maps friendly keys to --mk-* custom properties', () => {
    expect(resolveThemeVars({ chipBg: '#eef', chipText: '#33f' })).toEqual({
      '--mk-chip-bg': '#eef',
      '--mk-chip-text': '#33f',
    });
  });

  it('converts numeric radii to px', () => {
    expect(resolveThemeVars({ chipRadius: 6, cardRadius: 10 })).toEqual({
      '--mk-chip-radius': '6px',
      '--mk-card-radius': '10px',
    });
  });

  it('leaves string radii untouched', () => {
    expect(resolveThemeVars({ cardRadius: '0.5rem' })).toEqual({
      '--mk-card-radius': '0.5rem',
    });
  });

  it('seeds a full card set from a preset', () => {
    const vars = resolveThemeVars({ preset: 'dark' });
    expect(vars['--mk-card-bg']).toBe('#1e293b');
    expect(vars['--mk-card-text']).toBe('#f1f5f9');
    expect(vars['--mk-accent']).toBe('#60a5fa');
    expect(vars['--mk-card-radius']).toBe('12px');
  });

  it('lets explicit keys override the preset', () => {
    const vars = resolveThemeVars({ preset: 'light', cardBg: '#000000' });
    expect(vars['--mk-card-bg']).toBe('#000000');
    // untouched preset value still present
    expect(vars['--mk-card-text']).toBe('#1e293b');
  });

  it('only emits vars that are set (no preset, no forced defaults)', () => {
    const vars = resolveThemeVars({ accent: '#f472b6' });
    expect(vars).toEqual({ '--mk-accent': '#f472b6' });
  });
});

// ─── applyTheme ───────────────────────────────────────────────────────────────

describe('applyTheme', () => {
  it('writes resolved vars as inline custom properties', () => {
    const el = document.createElement('div');
    applyTheme(el, { chipBg: '#eef', cardRadius: 8 });
    expect(el.style.getPropertyValue('--mk-chip-bg')).toBe('#eef');
    expect(el.style.getPropertyValue('--mk-card-radius')).toBe('8px');
  });

  it('is a no-op for an absent theme', () => {
    const el = document.createElement('div');
    applyTheme(el);
    expect(el.getAttribute('style')).toBeFalsy();
  });
});
