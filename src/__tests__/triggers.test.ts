import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createMentionEditor,
  serializeToPersist,
  serializeToText,
  parsePersist,
  renderCommentMessageToHTML,
  type MentionItem,
  type MentionTrigger,
} from '../mention-editor';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USERS: MentionItem[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const TAGS: MentionItem[] = [
  { id: 't1', name: 'bug' },
  { id: 't2', name: 'feature' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function createEditor(triggers: MentionTrigger[]): {
  editor: ReturnType<typeof createMentionEditor>;
  editable: HTMLDivElement;
} {
  const container = makeContainer();
  const editor = createMentionEditor({
    container,
    get users() {
      return USERS;
    },
    triggers,
  });
  const editable = container.querySelector(
    '[contenteditable]',
  ) as HTMLDivElement;
  return { editor, editable };
}

function placeCaretAtEnd(el: HTMLElement): void {
  const sel = window.getSelection()!;
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
}

function type(el: HTMLElement, text: string): void {
  el.textContent = text;
  placeCaretAtEnd(el);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function fireKeydown(el: HTMLElement, key: string): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

const listbox = (): HTMLElement | null =>
  document.querySelector('[role="listbox"]');
const options = (): NodeListOf<HTMLElement> =>
  document.querySelectorAll('[role="option"]');

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

// ─── Multiple triggers ────────────────────────────────────────────────────────

describe('multiple triggers', () => {
  it('opens a dropdown for a custom # trigger', () => {
    const { editor, editable } = createEditor([
      { trigger: '@', items: USERS },
      { trigger: '#', items: TAGS },
    ]);
    type(editable, '#');
    expect(listbox()).toBeTruthy();
    expect(options()).toHaveLength(2);
    expect(listbox()!.textContent).toContain('bug');
    editor.destroy();
  });

  it('inserts a chip carrying the trigger and serialises as #{id}', () => {
    const { editor, editable } = createEditor([
      { trigger: '@', items: USERS },
      { trigger: '#', items: TAGS },
    ]);
    type(editable, '#');
    fireKeydown(editable, 'Enter'); // selects first tag: bug
    const nodes = editor.getNodes();
    const mention = nodes.find((n) => n.type === 'mention');
    expect(mention).toMatchObject({ trigger: '#', displayName: 'bug' });
    expect(serializeToPersist(nodes)).toContain('#{t1}');
    editor.destroy();
  });

  it('the @ trigger still serialises as @{id} (no trigger field)', () => {
    const { editor, editable } = createEditor([
      { trigger: '@', items: USERS },
      { trigger: '#', items: TAGS },
    ]);
    type(editable, '@');
    fireKeydown(editable, 'Enter'); // Alice
    const nodes = editor.getNodes();
    const mention = nodes.find((n) => n.type === 'mention');
    expect(mention).toMatchObject({ displayName: 'Alice' });
    expect(mention).not.toHaveProperty('trigger');
    expect(serializeToPersist(nodes)).toContain('@{u1}');
    editor.destroy();
  });
});

// ─── Custom filter / minChars / allowSpaces ─────────────────────────────────────

describe('per-trigger options', () => {
  it('uses a custom filter', () => {
    const { editor, editable } = createEditor([
      { trigger: '@', items: USERS, filter: (u) => u.id === 'u2' },
    ]);
    type(editable, '@a'); // query would match Alice by default, but filter forces Bob
    expect(options()).toHaveLength(1);
    expect(listbox()!.textContent).toContain('Bob');
    editor.destroy();
  });

  it('respects minChars', () => {
    const { editor, editable } = createEditor([
      { trigger: '@', items: USERS, minChars: 2 },
    ]);
    type(editable, '@a');
    expect(listbox()).toBeNull();
    type(editable, '@al');
    expect(listbox()).toBeTruthy();
    editor.destroy();
  });

  it('closes on a space unless allowSpaces is set', () => {
    const spaced: MentionItem[] = [{ id: 'x', name: 'a b c' }];
    const closes = createEditor([{ trigger: '@', items: spaced }]);
    type(closes.editable, '@a b');
    expect(listbox()).toBeNull();
    closes.editor.destroy();

    const stays = createEditor([
      { trigger: '@', items: spaced, allowSpaces: true },
    ]);
    type(stays.editable, '@a b');
    expect(options()).toHaveLength(1);
    stays.editor.destroy();
  });
});

// ─── Async suggestions ──────────────────────────────────────────────────────────

describe('async items', () => {
  it('debounces, shows a loading state, then renders results', async () => {
    vi.useFakeTimers();
    const fetchItems = vi.fn(
      (q: string) =>
        new Promise<MentionItem[]>((resolve) => {
          setTimeout(() => resolve(TAGS.filter((t) => t.name.includes(q))), 50);
        }),
    );
    const { editor, editable } = createEditor([
      { trigger: '/', items: fetchItems, serverFiltered: true, debounce: 100 },
    ]);

    type(editable, '/bug');
    expect(fetchItems).not.toHaveBeenCalled(); // debounce pending

    await vi.advanceTimersByTimeAsync(100); // debounce fires → loading
    expect(fetchItems).toHaveBeenCalledWith('bug');
    expect(options()).toHaveLength(0); // still loading

    await vi.advanceTimersByTimeAsync(50); // promise resolves
    expect(options()).toHaveLength(1);
    expect(listbox()!.textContent).toContain('bug');
    editor.destroy();
  });

  it('ignores stale async responses (race guard)', async () => {
    vi.useFakeTimers();
    const resolvers: ((v: MentionItem[]) => void)[] = [];
    const items = (): Promise<MentionItem[]> =>
      new Promise((res) => resolvers.push(res));
    const { editor, editable } = createEditor([
      { trigger: '/', items, serverFiltered: true },
    ]);

    type(editable, '/a'); // request 1
    type(editable, '/ab'); // request 2 (supersedes 1)

    resolvers[0]!([{ id: 'old', name: 'OLD' }]); // stale
    resolvers[1]!([{ id: 'new', name: 'NEW' }]); // current
    await vi.runAllTimersAsync();

    expect(listbox()!.textContent).toContain('NEW');
    expect(listbox()!.textContent).not.toContain('OLD');
    editor.destroy();
  });
});

// ─── Slash-command actions (#4) ─────────────────────────────────────────────────

describe('slash-command actions', () => {
  it('runs onSelect instead of inserting a chip and removes the trigger text', () => {
    const onSelect = vi.fn();
    const { editor, editable } = createEditor([
      { trigger: '/', items: [{ id: 'c1', name: 'archive' }], onSelect },
    ]);
    type(editable, '/arch');
    fireKeydown(editable, 'Enter');

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0]).toMatchObject({
      id: 'c1',
      name: 'archive',
    });
    // No chip; the "/arch" text is gone.
    expect(editor.getNodes().some((n) => n.type === 'mention')).toBe(false);
    expect(serializeToText(editor.getNodes())).not.toContain('/');
    editor.destroy();
  });

  it('ctx.insertText inserts text where the trigger was', () => {
    const { editor, editable } = createEditor([
      {
        trigger: '/',
        items: [{ id: 'c1', name: 'date' }],
        onSelect: (_item, ctx) => ctx.insertText('2026-07-04'),
      },
    ]);
    type(editable, '/date');
    fireKeydown(editable, 'Enter');
    expect(serializeToText(editor.getNodes())).toContain('2026-07-04');
    editor.destroy();
  });
});

// ─── Combobox a11y (#6) ─────────────────────────────────────────────────────────

describe('combobox a11y', () => {
  it('exposes aria-autocomplete and toggles expanded/controls/activedescendant', () => {
    const { editor, editable } = createEditor([{ trigger: '@', items: USERS }]);
    expect(editable.getAttribute('aria-autocomplete')).toBe('list');
    expect(editable.getAttribute('aria-expanded')).toBe('false');

    type(editable, '@');
    expect(editable.getAttribute('aria-expanded')).toBe('true');
    const id = listbox()!.id;
    expect(editable.getAttribute('aria-controls')).toBe(id);
    expect(editable.getAttribute('aria-activedescendant')).toBe(`${id}-opt-0`);
    expect(document.getElementById(`${id}-opt-0`)).toBeTruthy();

    fireKeydown(editable, 'ArrowDown');
    expect(editable.getAttribute('aria-activedescendant')).toBe(`${id}-opt-1`);

    fireKeydown(editable, 'Escape');
    expect(editable.getAttribute('aria-expanded')).toBe('false');
    expect(editable.hasAttribute('aria-controls')).toBe(false);
    expect(editable.hasAttribute('aria-activedescendant')).toBe(false);
    editor.destroy();
  });
});

// ─── Creatable items ────────────────────────────────────────────────────────────

describe('creatable items', () => {
  it('offers a Create row for an unmatched query and inserts a new chip', () => {
    const { editor, editable } = createEditor([
      { trigger: '#', items: TAGS, allowCreate: true },
    ]);
    type(editable, '#urgent'); // not in TAGS (bug, feature)
    expect(listbox()!.textContent).toContain('Create');

    fireKeydown(editable, 'Enter'); // selects the Create row
    const mention = editor.getNodes().find((n) => n.type === 'mention');
    expect(mention).toMatchObject({ trigger: '#', displayName: 'urgent' });
    expect(serializeToPersist(editor.getNodes())).toContain('#{urgent}');
    editor.destroy();
  });

  it('uses onCreate to build the new item (custom id)', () => {
    const { editor, editable } = createEditor([
      {
        trigger: '#',
        items: TAGS,
        onCreate: (q) => ({ id: `t-${q}`, name: q }),
      },
    ]);
    type(editable, '#urgent');
    fireKeydown(editable, 'Enter');
    expect(serializeToPersist(editor.getNodes())).toContain('#{t-urgent}');
    editor.destroy();
  });

  it('does not offer Create when an exact match already exists', () => {
    const { editor, editable } = createEditor([
      { trigger: '#', items: TAGS, allowCreate: true },
    ]);
    type(editable, '#bug'); // exact match
    expect(listbox()!.textContent).not.toContain('Create');
    expect(options()).toHaveLength(1);
    editor.destroy();
  });
});

// ─── Label styling (trigger-aware chips) ────────────────────────────────────────

describe('label styling', () => {
  it('renders non-@ chips as label pills (trigger prefix, no avatar)', () => {
    const { editor, editable } = createEditor([{ trigger: '#', items: TAGS }]);
    type(editable, '#');
    fireKeydown(editable, 'Enter'); // inserts "bug"
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    const leading = chip.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(leading.textContent).toBe('#'); // trigger prefix, not initials
    expect(chip.getAttribute('data-mention-trigger')).toBe('#');
    editor.destroy();
  });

  it('keeps @ chips avatar-style (initials)', () => {
    const { editor, editable } = createEditor([{ trigger: '@', items: USERS }]);
    type(editable, '@');
    fireKeydown(editable, 'Enter'); // Alice
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    const leading = chip.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(leading.textContent).toBe('A'); // initials
    editor.destroy();
  });

  it('renders label chips in HTML with a prefix and no avatar circle', () => {
    const html = renderCommentMessageToHTML('a #{t1}', USERS, undefined, [
      { trigger: '#', items: TAGS },
    ]);
    expect(html).toContain('>#</span>'); // trigger prefix
    expect(html).not.toContain('border-radius:50%'); // no avatar circle
  });
});

// ─── Persistence & render round-trips ───────────────────────────────────────────

describe('multi-trigger persistence', () => {
  it('round-trips mixed @ and # tokens', () => {
    const nodes = parsePersist('see #{t1} and @{u1}', USERS, [
      { trigger: '#', items: TAGS },
    ]);
    const tag = nodes.find((n) => n.type === 'mention' && n.trigger === '#');
    expect(tag).toMatchObject({ trigger: '#', displayName: 'bug' });
    expect(serializeToPersist(nodes)).toBe('see #{t1} and @{u1}');
  });

  it('renders # tokens to HTML with a trigger attribute', () => {
    const html = renderCommentMessageToHTML('a #{t1}', USERS, undefined, [
      { trigger: '#', items: TAGS },
    ]);
    expect(html).toContain('data-mention-id="t1"');
    expect(html).toContain('data-mention-trigger="#"');
    expect(html).toContain('bug');
  });

  it('legacy @-only render still works without triggerItems', () => {
    const html = renderCommentMessageToHTML('hi @{u1}', USERS);
    expect(html).toContain('data-mention-id="u1"');
    expect(html).not.toContain('data-mention-trigger');
    expect(html).toContain('Alice');
  });
});
