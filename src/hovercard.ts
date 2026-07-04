/**
 * @file hovercard.ts
 * @description
 * Hover user-info cards for rendered mentions.
 *
 * `attachHovercards(root, users)` wires a single floating card onto every
 * `[data-mention-id]` chip inside `root` — the output of
 * {@link renderCommentMessage} / {@link renderCommentMessageToHTML} or the React
 * `<RenderedMessage>` component. Hovering a mention pops a card with the user's
 * avatar, name, meta, and any extra `details`, each row optionally copyable.
 *
 * ```ts
 * const parts = renderCommentMessage(stored, users);
 * parts.forEach((p) =>
 *   el.append(typeof p === 'string' ? document.createTextNode(p) : p),
 * );
 * const cleanup = attachHovercards(el, users, { theme: { preset: 'dark' } });
 * // …later
 * cleanup();
 * ```
 *
 * The card is display-only interactive (copy buttons); it is **not** wired onto
 * the live editor — that surface is intentionally out of scope for v1.1.
 */

import {
  A_ID,
  deriveColor,
  initials,
  safeCSSColor,
  type MentionUser,
} from './mention-editor';
import { applyTheme, type MentionTheme } from './theme';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface HovercardOptions {
  /** ms before the card opens on hover. Default 180. */
  openDelay?: number;
  /** ms before the card closes after the pointer leaves. Default 140. */
  closeDelay?: number;
  /** Show a copy button on each `details` / email row. Default true. */
  copyFields?: boolean;
  /**
   * Show a "copy user" button. `true` copies a default summary
   * (`name <email>` or `name — meta`); pass a function for custom text.
   * Default true.
   */
  copyUser?: boolean | ((user: MentionUser) => string);
  /** Replace the entire card body with your own element. */
  render?: (user: MentionUser) => HTMLElement;
  /** Theme applied to the floating card. */
  theme?: MentionTheme;
  /** Extra class name appended to the card root. */
  className?: string;
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const isSafeHref = (href: string): boolean =>
  /^(https?:|mailto:|tel:)/i.test(href.trim());

const avatarColor = (user: MentionUser): string =>
  user.color ? safeCSSColor(user.color, user.id) : deriveColor(user.id);

const defaultCopyText = (user: MentionUser): string => {
  if (user.email) return `${user.name} <${user.email}>`;
  if (user.meta) return `${user.name} — ${user.meta}`;
  return user.name;
};

/** Writes text to the clipboard and flashes a ✓ on the button. */
const copyToClipboard = (text: string, btn: HTMLElement): void => {
  const done = (): void => {
    const prev = btn.getAttribute('data-mk-label') ?? btn.textContent ?? '';
    btn.textContent = '✓';
    btn.setAttribute('aria-label', 'Copied');
    window.setTimeout(() => {
      btn.textContent = prev;
      btn.setAttribute('aria-label', prev || 'Copy');
    }, 1200);
  };
  try {
    const p = navigator.clipboard?.writeText(text);
    if (p && typeof p.then === 'function') p.then(done, () => {});
    else done();
  } catch {
    /* clipboard unavailable — no-op */
  }
};

// ─── Element builders ─────────────────────────────────────────────────────────

const buildAvatar = (user: MentionUser): HTMLElement => {
  const color = avatarColor(user);
  const av = document.createElement('span');
  av.className = 'mk-hovercard__avatar';
  av.setAttribute('aria-hidden', 'true');
  av.style.cssText = [
    'width:40px',
    'height:40px',
    'border-radius:50%',
    `background:${color}`,
    'color:#fff',
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'font-size:15px',
    'font-weight:700',
    'flex-shrink:0',
    'overflow:hidden',
    'user-select:none',
  ].join(';');
  if (user.avatar) {
    const img = document.createElement('img');
    img.src = user.avatar;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    av.appendChild(img);
  } else {
    av.textContent = initials(user.name);
  }
  return av;
};

const buildCopyButton = (
  value: string,
  label: string,
  compact: boolean,
): HTMLButtonElement => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = compact
    ? 'mk-hovercard__copy mk-hovercard__copy--compact'
    : 'mk-hovercard__copy';
  btn.textContent = label;
  btn.setAttribute('data-mk-copy', value);
  btn.setAttribute('data-mk-label', label);
  btn.setAttribute('aria-label', compact ? 'Copy' : label);
  btn.style.cssText = [
    'appearance:none',
    'border:1px solid var(--mk-card-border,#e2e8f0)',
    'background:transparent',
    'color:var(--mk-accent,#2563eb)',
    'border-radius:6px',
    'cursor:pointer',
    'font:inherit',
    compact ? 'font-size:11px' : 'font-size:12px',
    'font-weight:600',
    compact ? 'padding:1px 6px' : 'padding:3px 10px',
    'line-height:1.4',
    'white-space:nowrap',
    'flex-shrink:0',
  ].join(';');
  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(value, btn);
  });
  return btn;
};

const buildRow = (
  detail: { label: string; value: string; copyable?: boolean; href?: string },
  copyFields: boolean,
): HTMLElement => {
  const row = document.createElement('div');
  row.className = 'mk-hovercard__row';
  row.style.cssText =
    'display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px;';

  const label = document.createElement('span');
  label.className = 'mk-hovercard__label';
  label.textContent = detail.label;
  label.style.cssText =
    'color:var(--mk-card-muted,#94a3b8);font-size:11px;font-weight:600;' +
    'text-transform:uppercase;letter-spacing:0.04em;flex-shrink:0;min-width:52px;';
  row.appendChild(label);

  let valueEl: HTMLElement;
  if (detail.href && isSafeHref(detail.href)) {
    const a = document.createElement('a');
    a.href = detail.href;
    a.textContent = detail.value;
    a.rel = 'noreferrer noopener';
    a.style.cssText =
      'color:var(--mk-accent,#2563eb);text-decoration:none;overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap;';
    valueEl = a;
  } else {
    valueEl = document.createElement('span');
    valueEl.textContent = detail.value;
    valueEl.style.cssText =
      'color:var(--mk-card-text,#1e293b);overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap;';
  }
  valueEl.className = 'mk-hovercard__value';
  valueEl.style.flex = '1';
  row.appendChild(valueEl);

  if (copyFields && detail.copyable !== false) {
    row.appendChild(buildCopyButton(detail.value, '⧉', true));
  }
  return row;
};

/** Assembles the default card body for a user. @internal */
const buildDefaultBody = (
  user: MentionUser,
  opts: HovercardOptions,
): DocumentFragment => {
  const copyFields = opts.copyFields !== false;
  const frag = document.createDocumentFragment();

  // ── Header ──────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'mk-hovercard__header';
  header.style.cssText = 'display:flex;align-items:flex-start;gap:10px;';
  header.appendChild(buildAvatar(user));

  const headText = document.createElement('div');
  headText.style.cssText = 'flex:1;min-width:0;';
  const name = document.createElement('div');
  name.className = 'mk-hovercard__name';
  name.textContent = user.name;
  name.style.cssText =
    'font-size:15px;font-weight:700;color:var(--mk-card-text,#1e293b);' +
    'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  headText.appendChild(name);
  if (user.meta) {
    const meta = document.createElement('div');
    meta.className = 'mk-hovercard__meta';
    meta.textContent = user.meta;
    meta.style.cssText =
      'font-size:12px;color:var(--mk-card-muted,#94a3b8);margin-top:2px;';
    headText.appendChild(meta);
  }
  header.appendChild(headText);

  if (opts.copyUser !== false) {
    const text =
      typeof opts.copyUser === 'function'
        ? opts.copyUser(user)
        : defaultCopyText(user);
    const btn = buildCopyButton(text, 'Copy', false);
    btn.classList.add('mk-hovercard__copy-user');
    header.appendChild(btn);
  }
  frag.appendChild(header);

  // ── Rows (email + details) ──────────────────────────────────────────────
  const rows: {
    label: string;
    value: string;
    copyable?: boolean;
    href?: string;
  }[] = [];
  if (user.email) {
    rows.push({
      label: 'Email',
      value: user.email,
      href: `mailto:${user.email}`,
    });
  }
  if (Array.isArray(user.details)) rows.push(...user.details);

  if (rows.length) {
    const body = document.createElement('div');
    body.className = 'mk-hovercard__rows';
    body.style.cssText =
      'margin-top:10px;padding-top:8px;border-top:1px solid ' +
      'var(--mk-card-border,#e2e8f0);';
    rows.forEach((r) => body.appendChild(buildRow(r, copyFields)));
    frag.appendChild(body);
  }
  return frag;
};

// ─── Card element ─────────────────────────────────────────────────────────────

const createCardElement = (opts: HovercardOptions): HTMLElement => {
  const card = document.createElement('div');
  card.className =
    'mk-hovercard' + (opts.className ? ` ${opts.className}` : '');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', 'User info');
  card.style.cssText = [
    'position:fixed',
    'z-index:9999',
    'box-sizing:border-box',
    'min-width:240px',
    'max-width:300px',
    'padding:12px 14px',
    'background:var(--mk-card-bg,#fff)',
    'color:var(--mk-card-text,#1e293b)',
    'border:1px solid var(--mk-card-border,#e2e8f0)',
    'border-radius:var(--mk-card-radius,12px)',
    'box-shadow:var(--mk-card-shadow,0 10px 25px rgba(0,0,0,0.12),0 4px 10px rgba(0,0,0,0.06))',
    'font-size:14px',
    'line-height:1.4',
    'text-align:left',
    'visibility:hidden',
  ].join(';');
  applyTheme(card, opts.theme);
  return card;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Wires hovercards onto every `[data-mention-id]` chip inside `root`.
 * Returns a cleanup function that removes all listeners and the shared card.
 */
export const attachHovercards = (
  root: HTMLElement,
  users: MentionUser[],
  opts: HovercardOptions = {},
): (() => void) => {
  const openDelay = opts.openDelay ?? 180;
  const closeDelay = opts.closeDelay ?? 140;
  const userById = new Map(users.map((u) => [u.id, u]));

  let card: HTMLElement | null = null;
  let hoveredChip: HTMLElement | null = null;
  let overCard = false;
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = (): void => {
    if (openTimer) clearTimeout(openTimer);
    if (closeTimer) clearTimeout(closeTimer);
    openTimer = closeTimer = undefined;
  };

  const position = (anchor: DOMRect): void => {
    if (!card) return;
    card.style.visibility = 'hidden';
    card.style.display = 'block';
    const h = card.offsetHeight || 160;
    const vpH = window.innerHeight;
    const spaceBelow = vpH - anchor.bottom;
    const openUp = spaceBelow < h && anchor.top > spaceBelow;
    card.style.left = `${Math.max(8, Math.min(anchor.left, window.innerWidth - 308))}px`;
    if (openUp) {
      card.style.top = '';
      card.style.bottom = `${vpH - anchor.top + 6}px`;
    } else {
      card.style.bottom = '';
      card.style.top = `${anchor.bottom + 6}px`;
    }
    card.style.visibility = 'visible';
  };

  const show = (chip: HTMLElement, user: MentionUser): void => {
    if (!card) {
      card = createCardElement(opts);
      card.addEventListener('mouseenter', () => {
        overCard = true;
        if (closeTimer) clearTimeout(closeTimer);
      });
      card.addEventListener('mouseleave', () => {
        overCard = false;
        scheduleClose();
      });
      document.body.appendChild(card);
    }
    card.innerHTML = '';
    card.appendChild(
      opts.render ? opts.render(user) : buildDefaultBody(user, opts),
    );
    position(chip.getBoundingClientRect());
  };

  const hide = (): void => {
    if (card) card.style.visibility = 'hidden';
    hoveredChip = null;
  };

  const scheduleClose = (): void => {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!overCard && !hoveredChip) hide();
    }, closeDelay);
  };

  const onEnter = (e: Event): void => {
    const chip = e.currentTarget as HTMLElement;
    const user = userById.get(chip.getAttribute(A_ID) ?? '');
    if (!user) return;
    hoveredChip = chip;
    if (closeTimer) clearTimeout(closeTimer);
    if (openTimer) clearTimeout(openTimer);
    openTimer = setTimeout(() => {
      if (hoveredChip === chip) show(chip, user);
    }, openDelay);
  };

  const onLeave = (): void => {
    hoveredChip = null;
    if (openTimer) clearTimeout(openTimer);
    scheduleClose();
  };

  const chips = Array.from(root.querySelectorAll<HTMLElement>(`[${A_ID}]`));
  chips.forEach((chip) => {
    chip.addEventListener('mouseenter', onEnter);
    chip.addEventListener('mouseleave', onLeave);
  });

  return () => {
    clearTimers();
    chips.forEach((chip) => {
      chip.removeEventListener('mouseenter', onEnter);
      chip.removeEventListener('mouseleave', onLeave);
    });
    card?.parentNode?.removeChild(card);
    card = null;
  };
};
