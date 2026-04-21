/**
 * @file mention.ts
 * @description
 * Headless, zero-dependency TypeScript mention editor built on a plain
 * `contentEditable` div.  No React, no framework.
 *
 * ## Quick start
 * ```ts
 * import { createMentionEditor } from './mention';
 *
 * const editor = createMentionEditor({
 *   container: document.getElementById('editor-root')!,
 *   get users() { return myUsers; },
 *   placeholder: 'Write a comment…',
 *   onChange: (nodes) => console.log(nodes),
 *   onSubmit: (nodes) => { save(nodes); editor.clear(); },
 * });
 *
 * editor.destroy(); // always call on unmount
 * ```
 *
 * ## Persistence format
 * Mentions are stored as `@{userId}` tokens:
 * ```
 * "Great work @{u1}, please check with @{u2} before merging."
 * ```
 *
 * ## Keyboard shortcuts
 * | Key           | Action                                          |
 * |---------------|-------------------------------------------------|
 * | `@`           | Opens the mention dropdown                      |
 * | `↑` / `↓`    | Navigate dropdown                               |
 * | `Enter`/`Tab` | Select highlighted user                         |
 * | `Escape`      | Close dropdown                                  |
 * | `Enter`       | Submit — calls `onSubmit`                       |
 * | `Shift+Enter` | Insert newline, stay in editor                  |
 * | `Backspace`   | On chip: shrinks name then removes; on selection: deletes selected content including chips |
 * | `Delete`      | Same as Backspace but forward                   |
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
  meta?: string;
  color?: string;
  [key: string]: unknown;
}

export type TextNode = { type: 'text'; text: string };
export type MentionNode = {
  type: 'mention';
  user: MentionUser;
  displayName: string;
};
export type EditorNode = TextNode | MentionNode;

export interface EditorCallbackMeta {
  /** Structured node array — the full document model. */
  nodes: EditorNode[];
  /** De-duplicated list of users mentioned in the current content. */
  mentionedUsers: MentionUser[];
  /** De-duplicated user IDs — saves a `.map(u => u.id)`. */
  mentionedUserIds: string[];
}

export interface MentionEditorOptions {
  container: HTMLElement;
  get users(): MentionUser[];
  placeholder?: string;
  maxSuggestions?: number;
  disabled?: boolean;
  onChange?: (text: string, meta: EditorCallbackMeta) => void;
  onSubmit?: (text: string, meta: EditorCallbackMeta) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  popoverPosition?: Partial<
    Record<'top' | 'left' | 'bottom' | 'right', number | string>
  >;
  renderUser?: (user: MentionUser, selected: boolean) => HTMLElement;
  palette?: string[];
}

export interface MentionEditorInstance {
  getNodes: () => EditorNode[];
  setNodes: (nodes: EditorNode[], emit?: boolean) => void;
  focus: () => void;
  clear: () => void;
  destroy: () => void;
  setPlaceholder: (text: string) => void;
  setDisabled: (value: boolean) => void;
  /** The underlying contentEditable DOM element. */
  readonly el: HTMLElement;
}

// ─── Callback data builder ───────────────────────────────────────────────────

/** @internal Builds text + meta from a node array for callbacks. */
const buildCallbackArgs = (
  nodes: EditorNode[],
): [string, EditorCallbackMeta] => {
  const text = nodes
    .map((n) => (n.type === 'text' ? n.text : `@${n.displayName}`))
    .join('');
  const seen = new Set<string>();
  const mentionedUsers: MentionUser[] = [];
  for (const n of nodes) {
    if (n.type === 'mention' && !seen.has(n.user.id)) {
      seen.add(n.user.id);
      mentionedUsers.push(n.user);
    }
  }
  return [
    text,
    {
      nodes,
      mentionedUsers,
      mentionedUserIds: mentionedUsers.map((u) => u.id),
    },
  ];
};

// ─── Serialisation helpers ────────────────────────────────────────────────────

export const serializeToText = (nodes: EditorNode[]): string =>
  nodes.map((n) => (n.type === 'text' ? n.text : `@${n.displayName}`)).join('');

export const serializeToMarkdown = (nodes: EditorNode[]): string =>
  nodes
    .map((n) =>
      n.type === 'text' ? n.text : `@[${n.displayName}](${n.user.id})`,
    )
    .join('');

/**
 * Serialises editor nodes into the `@{userId}` token format consumed by
 * `renderCommentMessage`, `renderCommentMessageToHTML`, and `parsePersist`.
 * This is the recommended format for database storage.
 */
export const serializeToPersist = (nodes: EditorNode[]): string =>
  nodes.map((n) => (n.type === 'text' ? n.text : `@{${n.user.id}}`)).join('');

/**
 * Parses a persisted `@{userId}` string back into `EditorNode[]`.
 * Users not found in the supplied list render as "Unknown User".
 */
export const parsePersist = (
  raw: string,
  users: MentionUser[],
): EditorNode[] => {
  const nodes: EditorNode[] = [];
  for (const part of raw.split(/(@\{[^}]+\})/g)) {
    const match = part.match(/^@\{(.+)\}$/);
    if (match) {
      const id = match[1]!;
      const user = users.find((u) => u.id === id);
      nodes.push({
        type: 'mention',
        user: user ?? { id, name: 'Unknown User' },
        displayName: user?.name ?? 'Unknown User',
      });
    } else if (part) {
      nodes.push({ type: 'text', text: part });
    }
  }
  return nodes;
};

// ─── Security helpers ─────────────────────────────────────────────────────────

/** @internal */
const escapeHTML = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const DEFAULT_MENTION_PALETTE = [
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#2563eb',
];

/** @internal */
const deriveColor = (
  id: string,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): string => {
  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? DEFAULT_MENTION_PALETTE[0]!;
};

/** @internal */
const safeCSSColor = (
  color: string | undefined,
  id: string,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): string => {
  if (!color) return deriveColor(id, palette);
  const t = color.trim();
  const ok =
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(t) ||
    /^rgba?\(\s*[\d.,\s%]+\)$/.test(t) ||
    /^hsla?\(\s*[\d.,\s%]+\)$/.test(t) ||
    /^[a-zA-Z]+$/.test(t);
  return ok ? t : deriveColor(id, palette);
};

/**
 * Converts any valid CSS colour accepted by `safeCSSColor` into an
 * `rgba(r,g,b,alpha)` string so we can reliably produce a translucent
 * background tint regardless of the input format.
 *
 * Handles:
 *  - 3-digit hex  #rgb   → expands to #rrggbb first
 *  - 6-digit hex  #rrggbb
 *  - 8-digit hex  #rrggbbaa  (alpha channel ignored — we supply our own)
 *  - Named colours / rgb() / hsl() → rendered to canvas to extract RGB
 *
 * Returns `rgba(0,0,0,0.08)` as a safe fallback if conversion fails.
 * @internal
 */
const toRgba = (color: string, alpha: number): string => {
  // Expand 3-digit hex → 6-digit
  const hex3 = color.match(/^#([0-9a-fA-F]{3})$/);
  const normalised = hex3
    ? `#${hex3[1]!
        .split('')
        .map((c) => c + c)
        .join('')}`
    : color;

  // Fast path: 6 or 8-digit hex
  const hex6 = normalised.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (hex6) {
    const r = parseInt(hex6[1]!.slice(0, 2), 16);
    const g = parseInt(hex6[1]!.slice(2, 4), 16);
    const b = parseInt(hex6[1]!.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Slow path: use a hidden canvas to resolve named colours / rgb() / hsl()
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return `rgba(0,0,0,${alpha})`;
    ctx.fillStyle = normalised;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(0,0,0,${alpha})`;
  }
};

export const renderCommentMessage = (
  message: string,
  users: MentionUser[],
  palette: string[] = DEFAULT_MENTION_PALETTE,
): (string | HTMLElement)[] =>
  message.split(/(@\{[^}]+\})/g).map((part) => {
    const m = part.match(/^@\{(.+)\}$/);
    if (!m) return part;
    const id = m[1]!;
    const user = users.find((u) => u.id === id);
    const name = user?.name ?? 'Unknown User';
    const color = safeCSSColor(user?.color, id, palette);
    return buildChip({ id, name, color }, name, palette);
  });

export const renderCommentMessageToHTML = (
  message: string,
  users: MentionUser[],
  palette: string[] = DEFAULT_MENTION_PALETTE,
): string =>
  message
    .split(/(@\{[^}]+\})/g)
    .map((part) => {
      const m = part.match(/^@\{(.+)\}$/);
      if (!m) return escapeHTML(part).replace(/\n/g, '<br>');
      const id = m[1]!;
      const user = users.find((u) => u.id === id);
      const name = user?.name ?? 'Unknown User';
      const color = safeCSSColor(user?.color, id, palette);
      const safeName = escapeHTML(name);
      const av = escapeHTML(
        name
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      );
      return [
        `<span style="display:inline-flex;align-items:center;gap:4px;color:${color};`,
        `background:${color}18;border-radius:5px;padding:1px 6px;font-weight:600;`,
        `white-space:nowrap;font-size:0.92em;vertical-align:middle">`,
        `<span aria-hidden="true" style="width:16px;height:16px;border-radius:50%;`,
        `background:${color};color:#fff;display:inline-flex;align-items:center;`,
        `justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;`,
        `user-select:none;pointer-events:none">${av}</span>`,
        `${safeName}</span>`,
      ].join('');
    })
    .join('');

// ─── DOM attribute keys ───────────────────────────────────────────────────────

const A_ID = 'data-mention-id';
const A_NAME = 'data-mention-name';
const A_DISPLAY = 'data-mention-display';
const A_COLOR = 'data-mention-color';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const isChip = (node: Node | null): node is HTMLElement =>
  !!node && (node as HTMLElement).hasAttribute?.(A_ID);

// ─── Chip builder ─────────────────────────────────────────────────────────────

const buildChip = (
  user: MentionUser,
  displayName: string,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): HTMLElement => {
  const c = user.color
    ? safeCSSColor(user.color, user.id, palette)
    : deriveColor(user.id, palette);
  const chip = document.createElement('span');
  chip.setAttribute(A_ID, user.id);
  chip.setAttribute(A_NAME, user.name);
  chip.setAttribute(A_DISPLAY, displayName);
  chip.setAttribute(A_COLOR, c);
  chip.contentEditable = 'false';
  chip.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'gap:4px',
    `color:${c}`,
    `background:${c}18`,
    'border-radius:5px',
    'padding:1px 6px',
    'font-weight:600',
    'cursor:default',
    'user-select:text',
    'white-space:nowrap',
    'font-size:0.92em',
  ].join(';');

  const av = document.createElement('span');
  av.setAttribute('aria-hidden', 'true');
  av.style.cssText = [
    'width:16px',
    'height:16px',
    'border-radius:50%',
    `background:${c}`,
    'color:#fff',
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'font-size:9px',
    'font-weight:700',
    'flex-shrink:0',
    'user-select:none',
    'pointer-events:none',
    '-webkit-user-select:none',
  ].join(';');

  if (user.avatar) {
    const img = document.createElement('img');
    img.src = user.avatar;
    img.alt = '';
    img.style.cssText =
      'width:100%;height:100%;border-radius:50%;object-fit:cover;';
    av.appendChild(img);
  } else {
    av.textContent = initials(user.name);
  }

  chip.appendChild(av);
  chip.appendChild(document.createComment('')); // selection boundary
  chip.appendChild(document.createTextNode(displayName));
  return chip;
};

const rebuildChipInner = (
  chip: HTMLElement,
  displayName: string,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): void => {
  const color =
    chip.getAttribute(A_COLOR) ??
    deriveColor(chip.getAttribute(A_ID) ?? '', palette);
  const userName = chip.getAttribute(A_NAME) ?? '';
  chip.setAttribute(A_DISPLAY, displayName);
  chip.innerHTML = '';
  const av = document.createElement('span');
  av.setAttribute('aria-hidden', 'true');
  av.style.cssText = [
    'width:16px',
    'height:16px',
    'border-radius:50%',
    `background:${color}`,
    'color:#fff',
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'font-size:9px',
    'font-weight:700',
    'flex-shrink:0',
    'user-select:none',
    'pointer-events:none',
    '-webkit-user-select:none',
  ].join(';');
  av.textContent = initials(userName);
  chip.appendChild(av);
  chip.appendChild(document.createComment(''));
  chip.appendChild(document.createTextNode(displayName));
};

// ─── DOM ↔ Node serialisation ─────────────────────────────────────────────────

const domToNodes = (
  container: HTMLElement,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): EditorNode[] => {
  const nodes: EditorNode[] = [];
  container.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child.textContent ?? '';
      if (t) nodes.push({ type: 'text', text: t });
    } else if (isChip(child)) {
      nodes.push({
        type: 'mention',
        user: {
          id: child.getAttribute(A_ID)!,
          name: child.getAttribute(A_NAME) ?? '',
          color:
            child.getAttribute(A_COLOR) ??
            deriveColor(child.getAttribute(A_ID) ?? '', palette),
        },
        displayName: child.getAttribute(A_DISPLAY) ?? '',
      });
    } else if (child.nodeType !== Node.COMMENT_NODE) {
      const t = (child as HTMLElement).textContent ?? '';
      if (t) nodes.push({ type: 'text', text: t });
    }
  });
  return nodes;
};

const nodesToDom = (
  container: HTMLElement,
  nodes: EditorNode[],
  palette: string[] = DEFAULT_MENTION_PALETTE,
): void => {
  container.innerHTML = '';
  nodes.forEach((n) =>
    container.appendChild(
      n.type === 'text'
        ? document.createTextNode(n.text)
        : buildChip(n.user, n.displayName, palette),
    ),
  );
};

// ─── Caret helpers ────────────────────────────────────────────────────────────

/**
 * Returns a flat char offset from the start of container.
 * Chips count as 1 character.
 * @internal
 */
const getCaretOffset = (container: HTMLElement): number => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  let offset = 0;

  const walk = (node: Node): boolean => {
    if (node === range.endContainer) {
      if (node.nodeType === Node.TEXT_NODE) offset += range.endOffset;
      else
        Array.from(node.childNodes)
          .slice(0, range.endOffset)
          .forEach((c) => {
            offset +=
              c.nodeType === Node.TEXT_NODE ? (c.textContent?.length ?? 0) : 1;
          });
      return true;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      offset += node.textContent?.length ?? 0;
      return false;
    }
    if (isChip(node as HTMLElement)) {
      offset += 1;
      return false;
    }
    for (const c of Array.from(node.childNodes)) {
      if (walk(c)) return true;
    }
    return false;
  };

  walk(container);
  return offset;
};

const setCaretOffset = (container: HTMLElement, target: number): void => {
  const sel = window.getSelection();
  if (!sel) return;
  let rem = target;

  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (rem <= len) {
        const r = document.createRange();
        r.setStart(node, rem);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        return true;
      }
      rem -= len;
      return false;
    }
    if (isChip(node as HTMLElement)) {
      if (rem <= 1) {
        const r = document.createRange();
        r.setStartAfter(node);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        return true;
      }
      rem -= 1;
      return false;
    }
    for (const c of Array.from(node.childNodes)) {
      if (walk(c)) return true;
    }
    return false;
  };

  if (!walk(container)) {
    const r = document.createRange();
    r.selectNodeContents(container);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  }
};

// ─── Selection helpers ────────────────────────────────────────────────────────

/**
 * Returns {start, end} flat char offsets for the current selection.
 * Works for both collapsed (start === end) and expanded selections.
 * @internal
 */
const getSelectionOffsets = (
  container: HTMLElement,
): { start: number; end: number } | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);

  // Helper: count chars from container start up to a (node, offset) position
  const countTo = (targetNode: Node, targetOffset: number): number => {
    let count = 0;
    const walk = (node: Node): boolean => {
      if (node === targetNode) {
        if (node.nodeType === Node.TEXT_NODE) count += targetOffset;
        else
          Array.from(node.childNodes)
            .slice(0, targetOffset)
            .forEach((c) => {
              count +=
                c.nodeType === Node.TEXT_NODE
                  ? (c.textContent?.length ?? 0)
                  : 1;
            });
        return true;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        count += node.textContent?.length ?? 0;
        return false;
      }
      if (isChip(node as HTMLElement)) {
        count += 1;
        return false;
      }
      for (const c of Array.from(node.childNodes)) {
        if (walk(c)) return true;
      }
      return false;
    };
    walk(container);
    return count;
  };

  const start = countTo(range.startContainer, range.startOffset);
  const end = countTo(range.endContainer, range.endOffset);
  return { start, end };
};

/**
 * Returns the chip immediately adjacent to the collapsed caret, or null.
 * Only called when the selection IS collapsed.
 * @internal
 */
const getAdjacentChip = (
  container: HTMLElement,
  direction: 'before' | 'after',
): HTMLElement | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return null;
  const { startContainer: sc, startOffset: so } = range;

  if (direction === 'before') {
    if (
      sc.nodeType === Node.TEXT_NODE &&
      so === 0 &&
      sc.parentNode === container
    ) {
      const p = sc.previousSibling;
      if (isChip(p)) return p;
    }
    if (sc === container && so > 0) {
      const p = container.childNodes[so - 1] ?? null;
      if (isChip(p)) return p as HTMLElement;
    }
  } else {
    if (
      sc.nodeType === Node.TEXT_NODE &&
      so === (sc.textContent?.length ?? 0) &&
      sc.parentNode === container
    ) {
      const n = sc.nextSibling;
      if (isChip(n)) return n;
    }
    if (sc === container) {
      const n = container.childNodes[so] ?? null;
      if (isChip(n)) return n as HTMLElement;
    }
  }
  return null;
};

// ─── Chip deletion (collapsed caret) ─────────────────────────────────────────

/**
 * Removes one word-segment at a time from a display name.
 *
 * Rules (Backspace / direction = 'before'):
 *   "River Vera"  → "River"   (removes last word)
 *   "River"       → ""        (single word → empty → chip removed)
 *
 * Rules (Delete / direction = 'after'):
 *   "River Vera"  → "Vera"    (removes first word)
 *   "Vera"        → ""        (single word → empty → chip removed)
 *
 * @internal
 */
const shrinkDisplayName = (
  current: string,
  direction: 'before' | 'after',
): string => {
  const trimmed = current.trim();
  if (direction === 'before') {
    const lastSpace = trimmed.lastIndexOf(' ');
    return lastSpace >= 0 ? trimmed.slice(0, lastSpace) : '';
  } else {
    const firstSpace = trimmed.indexOf(' ');
    return firstSpace >= 0 ? trimmed.slice(firstSpace + 1) : '';
  }
};
/**
 * Uses DOM index (not id lookup) to restore caret — fixes the bug where
 * backspacing a later chip would jump to an earlier chip with the same user.
 * @internal
 */
const handleChipDeletion = (
  container: HTMLElement,
  chip: HTMLElement,
  direction: 'before' | 'after',
  onChange?: (text: string, meta: EditorCallbackMeta) => void,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): void => {
  const currentDisplay = chip.getAttribute(A_DISPLAY) ?? '';
  const sel = window.getSelection();

  const newDisplay = shrinkDisplayName(currentDisplay, direction);

  if (!newDisplay) {
    // ── Remove chip entirely ─────────────────────────────────────────────────
    const anchor =
      direction === 'before' ? chip.nextSibling : chip.previousSibling;
    const oldChildren = Array.from(container.childNodes);
    container.removeChild(chip);

    const nodes = domToNodes(container, palette);
    nodesToDom(container, nodes, palette);

    if (anchor) {
      // Count chars before anchor (excluding the now-removed chip)
      let caretOffset = 0;
      for (const child of oldChildren) {
        if (child === chip) continue;
        if (child === anchor) break;
        caretOffset +=
          child.nodeType === Node.TEXT_NODE
            ? (child.textContent?.length ?? 0)
            : 1;
      }
      setCaretOffset(container, caretOffset);
    } else if (direction === 'before') {
      const r = document.createRange();
      r.selectNodeContents(container);
      r.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(r);
    } else {
      const r = document.createRange();
      r.setStart(container, 0);
      r.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
    onChange?.(...buildCallbackArgs(nodes));
  } else {
    // ── Shrink chip in place ─────────────────────────────────────────────────
    // Record chip's index in the DOM BEFORE rebuild so we can find it after.
    const chipIndex = Array.from(container.childNodes).indexOf(chip);

    rebuildChipInner(chip, newDisplay, palette);

    const nodes = domToNodes(container, palette);
    nodesToDom(container, nodes, palette);

    // Locate the rebuilt chip by its DOM index — not by user id.
    // Using id would find the FIRST chip with that id when the same user is
    // mentioned multiple times, causing the caret to jump to the wrong chip.
    const rebuiltChip = container.childNodes[chipIndex] as
      | ChildNode
      | undefined;
    if (rebuiltChip) {
      const r = document.createRange();
      if (direction === 'before') r.setStartAfter(rebuiltChip);
      else r.setStartBefore(rebuiltChip);
      r.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
    onChange?.(...buildCallbackArgs(nodes));
  }
};

// ─── Selection deletion (expanded selection) ──────────────────────────────────

/**
 * Deletes all content (text nodes and chips) that falls within the current
 * expanded selection, then places the caret at the deletion point.
 * Called when Backspace/Delete is pressed with a non-collapsed selection.
 * @internal
 */
const handleSelectionDeletion = (
  container: HTMLElement,
  onChange?: (text: string, meta: EditorCallbackMeta) => void,
  palette: string[] = DEFAULT_MENTION_PALETTE,
): void => {
  const offsets = getSelectionOffsets(container);
  if (!offsets || offsets.start === offsets.end) return;

  const { start, end } = offsets;
  const nodes = domToNodes(container, palette);

  // Build new node list excluding everything in [start, end)
  const newNodes: EditorNode[] = [];
  let charCount = 0;
  let caretPos = start; // caret lands at the start of the deleted range

  for (const node of nodes) {
    const len = node.type === 'text' ? node.text.length : 1;
    const nodeStart = charCount;
    const nodeEnd = charCount + len;

    if (nodeEnd <= start || nodeStart >= end) {
      // Completely outside selection — keep as-is
      newNodes.push(node);
    } else if (node.type === 'text') {
      // Partially overlaps — keep the parts outside the selection
      const keepBefore = node.text.slice(0, Math.max(0, start - nodeStart));
      const keepAfter = node.text.slice(Math.max(0, end - nodeStart));
      if (keepBefore) newNodes.push({ type: 'text', text: keepBefore });
      if (keepAfter) newNodes.push({ type: 'text', text: keepAfter });
    }
    // Chips entirely inside the selection are simply dropped (no else branch)

    charCount = nodeEnd;
  }

  nodesToDom(container, newNodes, palette);
  onChange?.(...buildCallbackArgs(newNodes));
  setCaretOffset(container, caretPos);
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────

interface DropdownState {
  el: HTMLElement;
  update: (query: string, selected: number, anchorRect: DOMRect) => void;
  destroy: () => void;
}

const createDropdown = (
  getUsers: () => MentionUser[],
  maxSuggestions: number,
  onSelect: (user: MentionUser) => void,
  renderUser?: (user: MentionUser, selected: boolean) => HTMLElement,
  posOverride?: MentionEditorOptions['popoverPosition'],
): DropdownState => {
  const el = document.createElement('div');
  el.setAttribute('role', 'listbox');
  el.style.cssText = [
    'position:fixed',
    'z-index:9999',
    'background:#fff',
    'border:1px solid #e2e8f0',
    'border-radius:10px',
    'box-shadow:0 10px 25px rgba(0,0,0,0.12),0 4px 10px rgba(0,0,0,0.06)',
    'min-width:230px',
    'max-width:320px',
    'max-height:260px',
    'overflow-y:auto',
    'padding:6px 0',
    'visibility:hidden',
  ].join(';');
  document.body.appendChild(el);

  const header = document.createElement('div');
  header.style.cssText =
    'padding:4px 12px 6px;font-size:11px;color:#94a3b8;font-weight:600;' +
    'letter-spacing:0.05em;text-transform:uppercase;';
  header.textContent = 'Mention someone';
  el.appendChild(header);

  const buildItem = (user: MentionUser, active: boolean): HTMLElement => {
    if (renderUser) return renderUser(user, active);
    const c = user.color ?? '#1976d2';
    const item = document.createElement('div');
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(active));
    item.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:10px',
      'padding:7px 12px',
      'cursor:pointer',
      `background:${active ? `${c}14` : 'transparent'}`,
      'transition:background 0.12s',
    ].join(';');

    const av = document.createElement('span');
    av.style.cssText =
      `width:32px;height:32px;border-radius:50%;background:${c};color:#fff;` +
      `display:flex;align-items:center;justify-content:center;font-size:12px;` +
      `font-weight:700;flex-shrink:0;overflow:hidden;`;
    if (user.avatar) {
      const img = document.createElement('img');
      img.src = user.avatar;
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      av.appendChild(img);
    } else {
      av.textContent = initials(user.name);
    }

    const text = document.createElement('span');
    const name = document.createElement('div');
    name.style.cssText = 'font-size:14px;font-weight:500;color:#1e293b;';
    name.textContent = user.name;
    text.appendChild(name);
    if (user.meta) {
      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:11px;color:#94a3b8;margin-top:1px;';
      meta.textContent = user.meta;
      text.appendChild(meta);
    }
    item.appendChild(av);
    item.appendChild(text);
    if (active) {
      const hint = document.createElement('span');
      hint.style.cssText = 'margin-left:auto;font-size:10px;color:#94a3b8;';
      hint.textContent = '↵';
      item.appendChild(hint);
    }
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onSelect(user);
    });
    return item;
  };

  const update = (
    query: string,
    selected: number,
    anchorRect: DOMRect,
  ): void => {
    const filtered = getUsers()
      .filter((u) => u.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, maxSuggestions);

    while (el.children.length > 1) el.removeChild(el.lastChild!);
    if (!filtered.length) {
      el.style.visibility = 'hidden';
      return;
    }

    filtered.forEach((user, i) =>
      el.appendChild(buildItem(user, i === selected)),
    );
    (el.children[selected + 1] as HTMLElement)?.scrollIntoView({
      block: 'nearest',
    });

    if (posOverride) {
      Object.assign(el.style, posOverride);
      el.style.visibility = 'visible';
      return;
    }

    el.style.visibility = 'hidden';
    el.style.display = 'block';
    const popH = el.offsetHeight || 240;
    const vpH = window.innerHeight;
    const spaceBelow = vpH - anchorRect.bottom;
    const openUp = spaceBelow < popH && anchorRect.top > spaceBelow;
    el.style.left = `${Math.min(anchorRect.left, window.innerWidth - 260)}px`;
    if (openUp) {
      el.style.top = '';
      el.style.bottom = `${vpH - anchorRect.top + 4}px`;
    } else {
      el.style.bottom = '';
      el.style.top = `${anchorRect.bottom + 4}px`;
    }
    el.style.visibility = 'visible';
  };

  const destroy = (): void => {
    el.parentNode?.removeChild(el);
  };
  return { el, update, destroy };
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createMentionEditor = (
  opts: MentionEditorOptions,
): MentionEditorInstance => {
  const {
    container,
    placeholder = 'Type @ to mention someone…',
    maxSuggestions = 8,
    disabled = false,
    onChange,
    onSubmit,
    onFocus,
    onBlur,
    popoverPosition,
    renderUser,
    palette = DEFAULT_MENTION_PALETTE,
  } = opts;

  const getUsers = (): MentionUser[] => opts.users;

  // ── DOM ───────────────────────────────────────────────────────────────────────

  const placeholderEl = document.createElement('div');
  placeholderEl.setAttribute('aria-hidden', 'true');
  placeholderEl.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'color:#94a3b8',
    'pointer-events:none',
    'user-select:none',
    'white-space:pre-wrap',
    'font-size:inherit',
    'line-height:inherit',
  ].join(';');
  placeholderEl.textContent = placeholder;
  container.appendChild(placeholderEl);

  const editable = document.createElement('div');
  editable.contentEditable = disabled ? 'false' : 'true';
  editable.setAttribute('role', 'textbox');
  editable.setAttribute('aria-multiline', 'true');
  editable.setAttribute('aria-label', placeholder);
  editable.style.cssText = [
    'outline:none',
    'min-height:1.4em',
    'white-space:pre-wrap',
    'word-break:break-word',
    'caret-color:#1976d2',
    'text-align:left',
  ].join(';');
  container.appendChild(editable);

  // ── State ─────────────────────────────────────────────────────────────────────

  let mentionQuery: string | null = null;
  let mentionStart: number = -1;
  let selectedIndex: number = 0;
  let dropdown: DropdownState | null = null;

  // ── Placeholder ───────────────────────────────────────────────────────────────

  const updatePlaceholder = (): void => {
    const nodes = domToNodes(editable, palette);
    const isEmpty =
      nodes.length === 0 ||
      (nodes.length === 1 &&
        nodes[0]!.type === 'text' &&
        (nodes[0] as TextNode).text === '');
    placeholderEl.style.display = isEmpty ? 'block' : 'none';
  };

  // ── Caret ─────────────────────────────────────────────────────────────────────

  const getCaretRect = (): DOMRect | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const r = sel.getRangeAt(0).cloneRange();
    r.collapse(true);
    const rect = r.getBoundingClientRect();
    if (!rect.width && !rect.height) return editable.getBoundingClientRect();
    return rect;
  };

  const placeCaretAtEnd = (): void => {
    const sel = window.getSelection();
    if (!sel) return;
    const r = document.createRange();
    r.selectNodeContents(editable);
    r.collapse(false);
    sel.removeAllRanges();
    sel.addRange(r);
  };

  const rescueCaretFromChip = (): void => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editable) {
      if (isChip(node as HTMLElement)) {
        placeCaretAtEnd();
        return;
      }
      node = node.parentNode;
    }
  };

  // ── Dropdown ──────────────────────────────────────────────────────────────────

  const openDropdown = (query: string, anchorRect: DOMRect): void => {
    if (!dropdown) {
      dropdown = createDropdown(
        getUsers,
        maxSuggestions,
        selectUser,
        renderUser,
        popoverPosition,
      );
    }
    dropdown.update(query, selectedIndex, anchorRect);
  };

  const closeDropdown = (): void => {
    dropdown?.destroy();
    dropdown = null;
    mentionQuery = null;
    selectedIndex = 0;
  };

  // ── Select user ───────────────────────────────────────────────────────────────

  const selectUser = (user: MentionUser): void => {
    const nodes = domToNodes(editable, palette);
    const endOffset = mentionStart + 1 + (mentionQuery?.length ?? 0);
    const fullUser = getUsers().find((u) => u.id === user.id) ?? user;

    let charCount = 0,
      tni = -1,
      tci = -1,
      eni = -1,
      eci = -1;
    for (let ni = 0; ni < nodes.length; ni++) {
      const node = nodes[ni]!;
      const len = node.type === 'text' ? node.text.length : 1;
      if (tni < 0 && charCount + len > mentionStart && node.type === 'text') {
        tni = ni;
        tci = mentionStart - charCount;
      }
      if (eni < 0 && charCount + len >= endOffset && node.type === 'text') {
        eni = ni;
        eci = endOffset - charCount;
      }
      charCount += len;
      if (tni >= 0 && eni >= 0) break;
    }
    if (tni < 0) return;

    const newNodes: EditorNode[] = [];
    let insertedAt = -1;
    for (let ni = 0; ni < nodes.length; ni++) {
      if (ni < tni || ni > eni) {
        newNodes.push(nodes[ni]!);
        continue;
      }
      if (ni === tni) {
        const tn = nodes[ni] as TextNode;
        const before = tn.text.slice(0, tci);
        const after = ni === eni ? tn.text.slice(eci) : '';
        if (before) newNodes.push({ type: 'text', text: before });
        insertedAt = newNodes.length;
        newNodes.push({
          type: 'mention',
          user: fullUser,
          displayName: fullUser.name,
        });
        newNodes.push({ type: 'text', text: ' ' + after });
      }
    }

    nodesToDom(editable, newNodes, palette);
    onChange?.(...buildCallbackArgs(newNodes));

    // Locate chip by index, not by id — fixes duplicate-mention caret jump
    const chipDomNode = editable.childNodes[insertedAt] as
      | HTMLElement
      | undefined;
    if (chipDomNode) {
      const textAfter = chipDomNode.nextSibling;
      const sel = window.getSelection();
      if (sel && textAfter?.nodeType === Node.TEXT_NODE) {
        const r = document.createRange();
        r.setStart(textAfter, 1);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }

    closeDropdown();
    updatePlaceholder();
    editable.focus();
  };

  // ── Input ─────────────────────────────────────────────────────────────────────

  const onInput = (): void => {
    const caret = getCaretOffset(editable);
    const nodes = domToNodes(editable, palette);
    nodesToDom(editable, nodes, palette);
    setCaretOffset(editable, caret);
    onChange?.(...buildCallbackArgs(nodes));
    updatePlaceholder();

    const flat = nodes
      .map((n) => (n.type === 'text' ? n.text : '\x00'))
      .join('');
    let triggerOffset = -1;
    for (let i = caret - 1; i >= 0; i--) {
      if (flat[i] === '@') {
        triggerOffset = i;
        break;
      }
      if (flat[i] === ' ' || flat[i] === '\n' || flat[i] === '\x00') break;
    }

    if (triggerOffset >= 0) {
      mentionStart = triggerOffset;
      mentionQuery = flat.slice(triggerOffset + 1, caret);
      selectedIndex = 0;
      const rect = getCaretRect();
      if (rect) openDropdown(mentionQuery, rect);
    } else {
      closeDropdown();
    }
  };

  // ── Keydown ───────────────────────────────────────────────────────────────────

  const onKeyDown = (e: KeyboardEvent): void => {
    // Dropdown navigation
    if (mentionQuery !== null && dropdown) {
      const filtered = getUsers()
        .filter((u) =>
          u.name.toLowerCase().includes(mentionQuery!.toLowerCase()),
        )
        .slice(0, maxSuggestions);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
        const rect = getCaretRect();
        if (rect) dropdown.update(mentionQuery!, selectedIndex, rect);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        const rect = getCaretRect();
        if (rect) dropdown.update(mentionQuery!, selectedIndex, rect);
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && filtered.length) {
        e.preventDefault();
        selectUser(filtered[selectedIndex]!);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        return;
      }
    }

    const sel = window.getSelection();

    // ── Handle Backspace / Delete ─────────────────────────────────────────────

    if (e.key === 'Backspace' || e.key === 'Delete') {
      const direction = e.key === 'Backspace' ? 'before' : 'after';

      // Case 1 — expanded selection: delete everything in the range,
      // including any chips that fall partially or fully inside it.
      if (sel && !sel.isCollapsed) {
        e.preventDefault();
        handleSelectionDeletion(
          editable,
          (text, meta) => {
            onChange?.(text, meta);
            updatePlaceholder();
          },
          palette,
        );
        return;
      }

      // Case 2 — collapsed caret adjacent to a chip: shrink or remove chip.
      const chip = getAdjacentChip(editable, direction);
      if (chip) {
        e.preventDefault();
        handleChipDeletion(
          editable,
          chip,
          direction,
          (text, meta) => {
            onChange?.(text, meta);
            updatePlaceholder();
          },
          palette,
        );
        return;
      }

      // Case 3 — everything else: let the browser handle it normally.
    }

    // Shift+Enter — newline
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const nl = document.createTextNode('\n');
        range.insertNode(nl);
        range.setStartAfter(nl);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        const caret = getCaretOffset(editable);
        const nodes = domToNodes(editable, palette);
        nodesToDom(editable, nodes, palette);
        setCaretOffset(editable, caret);
        onChange?.(...buildCallbackArgs(nodes));
        updatePlaceholder();
      }
      return;
    }

    // Enter — submit if handler provided, otherwise insert newline
    if (e.key === 'Enter' && !e.shiftKey) {
      if (onSubmit) {
        e.preventDefault();
        onSubmit(...buildCallbackArgs(domToNodes(editable, palette)));
      }
      // No onSubmit — let the browser insert a newline naturally
    }
  };

  // ── Outside click ─────────────────────────────────────────────────────────────

  const onDocClick = (e: MouseEvent): void => {
    if (
      dropdown &&
      !dropdown.el.contains(e.target as Node) &&
      !editable.contains(e.target as Node)
    ) {
      closeDropdown();
    }
  };

  // ── Focus / blur ──────────────────────────────────────────────────────────────

  const handleFocus = (): void => {
    rescueCaretFromChip();
    onFocus?.();
  };

  const handleBlur = (): void => {
    onBlur?.();
  };

  // ── Wire events ───────────────────────────────────────────────────────────────

  editable.addEventListener('input', onInput);
  editable.addEventListener('keydown', onKeyDown);
  editable.addEventListener('focus', handleFocus);
  editable.addEventListener('blur', handleBlur);
  editable.addEventListener('click', rescueCaretFromChip);
  document.addEventListener('click', onDocClick);

  updatePlaceholder();

  // ── Public API ────────────────────────────────────────────────────────────────

  const getNodes = (): EditorNode[] => domToNodes(editable, palette);

  const setNodes = (nodes: EditorNode[], emit = false): void => {
    nodesToDom(editable, nodes, palette);
    updatePlaceholder();
    placeCaretAtEnd();
    if (emit) onChange?.(...buildCallbackArgs(nodes));
  };

  const setPlaceholder = (text: string): void => {
    placeholderEl.textContent = text;
    editable.setAttribute('aria-label', text);
    updatePlaceholder();
  };

  const focus = (): void => {
    editable.focus();
    placeCaretAtEnd();
  };

  const clear = (): void => {
    editable.innerHTML = '';
    closeDropdown();
    updatePlaceholder();
    onChange?.(...buildCallbackArgs([]));
  };

  const setDisabled = (value: boolean): void => {
    editable.contentEditable = value ? 'false' : 'true';
  };

  const destroy = (): void => {
    editable.removeEventListener('input', onInput);
    editable.removeEventListener('keydown', onKeyDown);
    editable.removeEventListener('focus', handleFocus);
    editable.removeEventListener('blur', handleBlur);
    editable.removeEventListener('click', rescueCaretFromChip);
    document.removeEventListener('click', onDocClick);
    closeDropdown();
    container.innerHTML = '';
  };

  return {
    getNodes,
    setNodes,
    focus,
    clear,
    destroy,
    setPlaceholder,
    setDisabled,
    el: editable,
  };
};
