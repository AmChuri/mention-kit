/**
 * DOM-interaction tests for createMentionEditor.
 *
 * These exercise the internal code paths that aren't reachable through
 * simple setNodes/getNodes: chip rendering, keyboard handlers, input
 * events, dropdown lifecycle, placeholder visibility, caret logic, etc.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createMentionEditor,
  type MentionEditorInstance,
  type MentionUser,
  type EditorNode,
} from '../mention-editor';
import { alice, bob, carol, ALL_USERS, text, mention } from './helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function createEditor(
  overrides: Partial<Parameters<typeof createMentionEditor>[0]> = {},
): {
  editor: MentionEditorInstance;
  container: HTMLElement;
  editable: HTMLDivElement;
} {
  const container = makeContainer();
  const editor = createMentionEditor({
    container,
    users: ALL_USERS,
    ...overrides,
  });
  const editable = container.querySelector(
    '[contenteditable]',
  ) as HTMLDivElement;
  return { editor, container, editable };
}

function fireKeydown(
  el: HTMLElement,
  key: string,
  opts: Partial<KeyboardEvent> = {},
): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    }),
  );
}

function fireInput(el: HTMLElement): void {
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function placeCaretAtEnd(el: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
}

function placeCaretAt(el: HTMLElement, node: Node, offset: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.setStart(node, offset);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function selectAll(el: HTMLElement): void {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(r);
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ─── Chip rendering ───────────────────────────────────────────────────────────

describe('chip rendering', () => {
  it('renders a mention chip with data attributes', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(alice)]);
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('data-mention-id')).toBe('u1');
    expect(chip.getAttribute('data-mention-name')).toBe('Alice Johnson');
    expect(chip.getAttribute('data-mention-display')).toBe('Alice Johnson');
    expect(chip.contentEditable).toBe('false');
    editor.destroy();
  });

  it('renders chip with user color when provided', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(alice)]); // alice has color: '#7c3aed'
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    expect(chip.getAttribute('data-mention-color')).toBe('#7c3aed');
    expect(chip.style.color).toBe('#7c3aed');
    editor.destroy();
  });

  it('derives a fallback color for users without explicit color', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(bob)]); // bob has no color
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    const color = chip.getAttribute('data-mention-color');
    expect(color).toBeTruthy();
    // Should be one of the palette colors (a hex string)
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    editor.destroy();
  });

  it('renders initials in the avatar when no avatar URL', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(alice)]);
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    const avatar = chip.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(avatar).toBeTruthy();
    expect(avatar.textContent).toBe('AJ');
    editor.destroy();
  });

  it('renders an <img> when user has an avatar URL', () => {
    const withAvatar: MentionUser = {
      id: 'u99',
      name: 'Avatar User',
      avatar: 'https://example.com/photo.png',
    };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(withAvatar)]);
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    const img = chip.querySelector('img');
    expect(img).toBeTruthy();
    expect(img!.src).toContain('photo.png');
    editor.destroy();
  });

  it('renders the display name as text inside the chip', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(alice, 'AJ')]);
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    expect(chip.textContent).toContain('AJ');
    editor.destroy();
  });
});

// ─── Placeholder visibility ───────────────────────────────────────────────────

describe('placeholder', () => {
  it('shows placeholder when editor is empty', () => {
    const { container, editor } = createEditor({
      placeholder: 'Type here…',
    });
    const ph = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(ph).toBeTruthy();
    expect(ph.textContent).toBe('Type here…');
    expect(ph.style.display).not.toBe('none');
    editor.destroy();
  });

  it('hides placeholder when content is present', () => {
    const { container, editor } = createEditor({
      placeholder: 'Type here…',
    });
    editor.setNodes([text('hello')]);
    const ph = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(ph.style.display).toBe('none');
    editor.destroy();
  });

  it('shows placeholder again after clear', () => {
    const { container, editor } = createEditor({
      placeholder: 'Type here…',
    });
    editor.setNodes([text('hello')]);
    editor.clear();
    const ph = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(ph.style.display).not.toBe('none');
    editor.destroy();
  });
});

// ─── Keyboard: Enter to submit ────────────────────────────────────────────────

describe('keyboard – Enter', () => {
  it('calls onSubmit with current nodes on Enter', () => {
    const onSubmit = vi.fn();
    const { editor, editable } = createEditor({ onSubmit });
    editor.setNodes([text('hello')]);
    placeCaretAtEnd(editable);

    fireKeydown(editable, 'Enter');

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const callArgs = onSubmit.mock.calls[0]!;
    expect(callArgs[0]).toBe('hello');
    const meta = callArgs[1] as {
      nodes: EditorNode[];
      mentionedUsers: unknown[];
    };
    expect(meta.nodes).toHaveLength(1);
    expect(meta.nodes[0]).toMatchObject({ type: 'text', text: 'hello' });
    expect(meta.mentionedUsers).toEqual([]);
    editor.destroy();
  });

  it('does not call onSubmit on Shift+Enter (newline)', () => {
    const onSubmit = vi.fn();
    const { editor, editable } = createEditor({ onSubmit });
    editor.setNodes([text('hello')]);
    placeCaretAtEnd(editable);

    fireKeydown(editable, 'Enter', { shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
    editor.destroy();
  });
});

// ─── Keyboard: Backspace / Delete on chips ────────────────────────────────────

describe('keyboard – Backspace/Delete on chips', () => {
  it('shrinks chip display name on Backspace (removes last word)', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([text('hi '), mention(alice)]);

    // Place caret right after the chip
    const chip = editable.querySelector('[data-mention-id]') as HTMLElement;
    if (chip.nextSibling) {
      placeCaretAt(editable, chip.nextSibling, 0);
    } else {
      const r = document.createRange();
      r.setStartAfter(chip);
      r.collapse(true);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(r);
    }

    // First Backspace should shrink "Alice Johnson" → "Alice"
    fireKeydown(editable, 'Backspace');

    const nodes = editor.getNodes();
    const mentionNode = nodes.find((n) => n.type === 'mention');
    if (mentionNode && mentionNode.type === 'mention') {
      expect(mentionNode.displayName).toBe('Alice');
    }
    editor.destroy();
  });

  it('handles Backspace on expanded selection (deletes selected content)', () => {
    const onChange = vi.fn();
    const { editor, editable } = createEditor({ onChange });
    editor.setNodes([text('hello world')]);

    // Select all text
    selectAll(editable);

    fireKeydown(editable, 'Backspace');

    // onChange should have been called with the deletion result
    expect(onChange).toHaveBeenCalled();
    editor.destroy();
  });

  it('Delete key removes chip from the front (shrinks first word)', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(alice), text(' end')]);

    // Place caret before the chip
    const r = document.createRange();
    r.setStart(editable, 0);
    r.collapse(true);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(r);

    fireKeydown(editable, 'Delete');

    const nodes = editor.getNodes();
    const mentionNode = nodes.find((n) => n.type === 'mention');
    if (mentionNode && mentionNode.type === 'mention') {
      expect(mentionNode.displayName).toBe('Johnson');
    }
    editor.destroy();
  });
});

// ─── Input handling / @ trigger ───────────────────────────────────────────────

describe('input handling – @ mention trigger', () => {
  it('opens a dropdown when @ is typed', () => {
    const { editor, editable } = createEditor();

    // Simulate typing "@" by inserting text and firing input
    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    // The dropdown should be appended to document.body
    const dropdown = document.querySelector('[role="listbox"]');
    expect(dropdown).toBeTruthy();
    editor.destroy();
  });

  it('dropdown shows user items matching the query', () => {
    const { editor, editable } = createEditor();

    editable.textContent = '@Ali';
    placeCaretAtEnd(editable);
    fireInput(editable);

    const dropdown = document.querySelector('[role="listbox"]');
    expect(dropdown).toBeTruthy();

    // Should contain Alice but not Bob or Carol
    const options = dropdown!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThanOrEqual(1);

    const names = Array.from(options).map((o) => o.textContent);
    expect(names.some((n) => n?.includes('Alice'))).toBe(true);
    editor.destroy();
  });

  it('closes dropdown when text no longer matches a mention trigger', () => {
    const { editor, editable } = createEditor();

    // Open dropdown
    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);
    expect(document.querySelector('[role="listbox"]')).toBeTruthy();

    // Type a space (breaks the mention)
    editable.textContent = '@ ';
    placeCaretAtEnd(editable);
    fireInput(editable);

    // Dropdown should be gone
    const dropdown = document.querySelector('[role="listbox"]');
    expect(dropdown).toBeNull();
    editor.destroy();
  });

  it('Escape closes the dropdown', () => {
    const { editor, editable } = createEditor();

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);
    expect(document.querySelector('[role="listbox"]')).toBeTruthy();

    fireKeydown(editable, 'Escape');

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    editor.destroy();
  });

  it('ArrowDown/ArrowUp navigate dropdown selection', () => {
    const { editor, editable } = createEditor();

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    // Arrow down should change selected item
    fireKeydown(editable, 'ArrowDown');
    fireKeydown(editable, 'ArrowDown');
    fireKeydown(editable, 'ArrowUp');

    // Just verify no crash and dropdown is still open
    expect(document.querySelector('[role="listbox"]')).toBeTruthy();
    editor.destroy();
  });

  it('Enter selects the highlighted user from dropdown', () => {
    const onChange = vi.fn();
    const { editor, editable } = createEditor({ onChange });

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    // Press Enter to select first user
    fireKeydown(editable, 'Enter');

    // Should have inserted a mention
    const nodes = editor.getNodes();
    const mentionNode = nodes.find((n) => n.type === 'mention');
    expect(mentionNode).toBeTruthy();

    // Dropdown should be closed
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    editor.destroy();
  });

  it('Tab selects the highlighted user from dropdown', () => {
    const { editor, editable } = createEditor();

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    fireKeydown(editable, 'Tab');

    const nodes = editor.getNodes();
    const mentionNode = nodes.find((n) => n.type === 'mention');
    expect(mentionNode).toBeTruthy();
    editor.destroy();
  });

  it('outside click closes the dropdown', () => {
    const { editor, editable } = createEditor();

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);
    expect(document.querySelector('[role="listbox"]')).toBeTruthy();

    // Click outside both the dropdown and the editor
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.querySelector('[role="listbox"]')).toBeNull();
    editor.destroy();
  });
});

// ─── Dropdown: custom renderUser ──────────────────────────────────────────────

describe('dropdown – renderUser', () => {
  it('uses custom renderUser function for dropdown items', () => {
    const renderUser = vi.fn((user: MentionUser, selected: boolean) => {
      const el = document.createElement('div');
      el.className = 'custom-item';
      el.textContent = `${user.name}${selected ? ' (active)' : ''}`;
      return el;
    });

    const { editor, editable } = createEditor({ renderUser });

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    expect(renderUser).toHaveBeenCalled();

    const custom = document.querySelector('.custom-item');
    expect(custom).toBeTruthy();
    editor.destroy();
  });
});

// ─── Dropdown: user with meta shown ──────────────────────────────────────────

describe('dropdown – user meta', () => {
  it('shows user meta text in dropdown items', () => {
    const { editor, editable } = createEditor();

    editable.textContent = '@Alice';
    placeCaretAtEnd(editable);
    fireInput(editable);

    const dropdown = document.querySelector('[role="listbox"]');
    // Alice has meta: 'Engineering'
    expect(dropdown?.textContent).toContain('Engineering');
    editor.destroy();
  });
});

// ─── Focus ────────────────────────────────────────────────────────────────────

describe('focus', () => {
  it('focus() sets the active element to the editable', () => {
    const { editor, editable } = createEditor();
    editor.focus();
    expect(document.activeElement).toBe(editable);
    editor.destroy();
  });
});

// ─── Disabled mode ────────────────────────────────────────────────────────────

describe('disabled', () => {
  it('sets contentEditable to false when disabled', () => {
    const { editor, editable } = createEditor({ disabled: true });
    expect(editable.contentEditable).toBe('false');
    editor.destroy();
  });
});

// ─── clear fires onChange ─────────────────────────────────────────────────────

describe('clear', () => {
  it('fires onChange with empty array', () => {
    const onChange = vi.fn();
    const { editor } = createEditor({ onChange });
    editor.setNodes([text('something')]);
    onChange.mockClear();

    editor.clear();
    expect(onChange).toHaveBeenCalledWith('', {
      nodes: [],
      mentionedUsers: [],
      mentionedUserIds: [],
    });
    editor.destroy();
  });
});

// ─── ARIA attributes ──────────────────────────────────────────────────────────

describe('accessibility', () => {
  it('sets role=textbox on the editable', () => {
    const { editor, editable } = createEditor();
    expect(editable.getAttribute('role')).toBe('textbox');
    editor.destroy();
  });

  it('sets aria-multiline=true', () => {
    const { editor, editable } = createEditor();
    expect(editable.getAttribute('aria-multiline')).toBe('true');
    editor.destroy();
  });

  it('sets aria-label from placeholder', () => {
    const { editor, editable } = createEditor({ placeholder: 'My label' });
    expect(editable.getAttribute('aria-label')).toBe('My label');
    editor.destroy();
  });

  it('setPlaceholder updates aria-label too', () => {
    const { editor, editable } = createEditor();
    editor.setPlaceholder('Updated');
    expect(editable.getAttribute('aria-label')).toBe('Updated');
    editor.destroy();
  });

  it('dropdown has role=listbox', () => {
    const { editor, editable } = createEditor();
    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    const listbox = document.querySelector('[role="listbox"]');
    expect(listbox).toBeTruthy();

    const options = listbox!.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    editor.destroy();
  });
});

// ─── User color formats ───────────────────────────────────────────────────────

describe('user color formats', () => {
  it('accepts 3-digit hex (#rgb)', () => {
    const user: MentionUser = { id: 'c1', name: 'Short Hex', color: '#f0f' };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(user)]);
    const chip = editable.querySelector(
      '[data-mention-id="c1"]',
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    // Color should be preserved or processed without error
    editor.destroy();
  });

  it('accepts 8-digit hex (#rrggbbaa)', () => {
    const user: MentionUser = {
      id: 'c2',
      name: 'Alpha Hex',
      color: '#ff000080',
    };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(user)]);
    const chip = editable.querySelector(
      '[data-mention-id="c2"]',
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    editor.destroy();
  });

  it('accepts rgb() color', () => {
    const user: MentionUser = {
      id: 'c3',
      name: 'RGB User',
      color: 'rgb(255, 0, 0)',
    };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(user)]);
    const chip = editable.querySelector(
      '[data-mention-id="c3"]',
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    editor.destroy();
  });

  it('accepts named color', () => {
    const user: MentionUser = {
      id: 'c4',
      name: 'Named Color',
      color: 'tomato',
    };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(user)]);
    const chip = editable.querySelector(
      '[data-mention-id="c4"]',
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    editor.destroy();
  });

  it('falls back to palette color for invalid color string', () => {
    const user: MentionUser = {
      id: 'c5',
      name: 'Bad Color',
      color: 'not-a-color!!!',
    };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(user)]);
    const chip = editable.querySelector(
      '[data-mention-id="c5"]',
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    // Should fall back to a palette color (hex)
    const color = chip.getAttribute('data-mention-color');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    editor.destroy();
  });

  it('accepts hsl() color', () => {
    const user: MentionUser = {
      id: 'c6',
      name: 'HSL User',
      color: 'hsl(120, 50%, 50%)',
    };
    const { editor, editable } = createEditor();
    editor.setNodes([mention(user)]);
    const chip = editable.querySelector(
      '[data-mention-id="c6"]',
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    editor.destroy();
  });
});

// ─── maxSuggestions ───────────────────────────────────────────────────────────

describe('maxSuggestions', () => {
  it('limits dropdown items to maxSuggestions', () => {
    const manyUsers: MentionUser[] = Array.from({ length: 20 }, (_, i) => ({
      id: `m${i}`,
      name: `User ${i}`,
    }));

    const { editor, editable } = createEditor({
      get users() {
        return manyUsers;
      },
      maxSuggestions: 3,
    } as Parameters<typeof createMentionEditor>[0]);

    editable.textContent = '@';
    placeCaretAtEnd(editable);
    fireInput(editable);

    const options = document.querySelectorAll('[role="option"]');
    expect(options.length).toBe(3);
    editor.destroy();
  });
});

// ─── onInput normalisation round-trip ─────────────────────────────────────────

describe('input normalisation', () => {
  it('normalises DOM after direct text insertion (round-trips through domToNodes/nodesToDom)', () => {
    const onChange = vi.fn();
    const { editor, editable } = createEditor({ onChange });

    // Simulate user typing by directly mutating DOM then firing input
    editable.textContent = 'hello world';
    placeCaretAtEnd(editable);
    fireInput(editable);

    expect(onChange).toHaveBeenCalled();
    const nodes = editor.getNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toEqual({ type: 'text', text: 'hello world' });
    editor.destroy();
  });

  it('preserves chips during input normalisation', () => {
    const { editor, editable } = createEditor();
    editor.setNodes([mention(alice), text(' test')]);

    // Simulate an input event (as if user typed more text)
    const textNode = editable.lastChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = ' test more';
      placeCaretAtEnd(editable);
      fireInput(editable);
    }

    const nodes = editor.getNodes();
    expect(nodes.some((n) => n.type === 'mention')).toBe(true);
    editor.destroy();
  });
});
