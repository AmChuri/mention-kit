/**
 * @file theme.ts
 * @description
 * Design-token theming for @cursortag/mention-kit.
 *
 * Chips and hovercards read their styling from CSS custom properties
 * (`--mk-*`) with the library's built-in look supplied as the `var()`
 * fallback. That means:
 *
 *  - **Default look is unchanged** — every fallback matches the previous
 *    hard-coded value, and per-user colors still win for chips.
 *  - **CSS-only theming** — override any `--mk-*` on an ancestor (chips) or on
 *    `.mk-hovercard` (the floating card) and you never touch JS.
 *  - **JS theming** — pass a {@link MentionTheme} object and the matching
 *    `--mk-*` vars are written inline for you, with `light` / `dark` presets.
 *
 * ```ts
 * applyTheme(container, { preset: 'dark', accent: '#f472b6' });
 * ```
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MentionTheme {
  /** Seeds a full base set of card vars; explicit keys below override it. */
  preset?: 'light' | 'dark';
  /** Chip background. Falls back to the per-user color tint when unset. */
  chipBg?: string;
  /** Chip text color. Falls back to the per-user color when unset. */
  chipText?: string;
  /** Chip corner radius. Number → px. */
  chipRadius?: string | number;
  cardBg?: string;
  cardText?: string;
  cardMuted?: string;
  cardBorder?: string;
  cardShadow?: string;
  /** Card corner radius. Number → px. */
  cardRadius?: string | number;
  /** Accent color — copy buttons, links, focus affordances. */
  accent?: string;
}

// ─── Token map ──────────────────────────────────────────────────────────────

/** Friendly theme key → CSS custom property. @internal */
const VAR_BY_KEY: Record<keyof Omit<MentionTheme, 'preset'>, string> = {
  chipBg: '--mk-chip-bg',
  chipText: '--mk-chip-text',
  chipRadius: '--mk-chip-radius',
  cardBg: '--mk-card-bg',
  cardText: '--mk-card-text',
  cardMuted: '--mk-card-muted',
  cardBorder: '--mk-card-border',
  cardShadow: '--mk-card-shadow',
  cardRadius: '--mk-card-radius',
  accent: '--mk-accent',
};

/** Keys whose numeric values should be treated as pixel lengths. @internal */
const LENGTH_KEYS = new Set(['chipRadius', 'cardRadius']);

const PRESETS: Record<'light' | 'dark', MentionTheme> = {
  light: {
    cardBg: '#ffffff',
    cardText: '#1e293b',
    cardMuted: '#94a3b8',
    cardBorder: '#e2e8f0',
    cardShadow: '0 10px 25px rgba(0,0,0,0.12),0 4px 10px rgba(0,0,0,0.06)',
    cardRadius: 12,
    accent: '#2563eb',
  },
  dark: {
    cardBg: '#1e293b',
    cardText: '#f1f5f9',
    cardMuted: '#94a3b8',
    cardBorder: '#334155',
    cardShadow: '0 10px 25px rgba(0,0,0,0.5),0 4px 10px rgba(0,0,0,0.35)',
    cardRadius: 12,
    accent: '#60a5fa',
  },
};

// ─── Resolution ───────────────────────────────────────────────────────────────

const toCSSValue = (key: string, value: string | number): string =>
  typeof value === 'number' && LENGTH_KEYS.has(key) ? `${value}px` : `${value}`;

/**
 * Flattens a {@link MentionTheme} into a `{ '--mk-*': value }` map.
 * Only the vars implied by the theme are emitted (preset base + explicit
 * overrides) — everything else keeps its built-in `var()` fallback.
 * Returns `{}` for an absent/empty theme.
 */
export const resolveThemeVars = (
  theme?: MentionTheme,
): Record<string, string> => {
  if (!theme) return {};
  const merged: MentionTheme = theme.preset
    ? { ...PRESETS[theme.preset], ...theme }
    : theme;

  const vars: Record<string, string> = {};
  for (const key of Object.keys(VAR_BY_KEY) as (keyof typeof VAR_BY_KEY)[]) {
    const value = merged[key];
    if (value === undefined) continue;
    vars[VAR_BY_KEY[key]] = toCSSValue(key, value);
  }
  return vars;
};

/**
 * Writes the resolved `--mk-*` vars onto `el` as inline custom properties.
 * A no-op when `theme` is absent or empty.
 */
export const applyTheme = (el: HTMLElement, theme?: MentionTheme): void => {
  const vars = resolveThemeVars(theme);
  for (const [name, value] of Object.entries(vars)) {
    el.style.setProperty(name, value);
  }
};
