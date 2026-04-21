/**
 * Tests for v0.1.2 features: setDisabled, el, onFocus/onBlur,
 * mentionedUserIds, defaultValue.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createMentionEditor,
  parsePersist,
  serializeToPersist,
  type MentionEditorInstance,
} from '../mention-editor';
import { alice, bob, ALL_USERS, text, mention } from './helpers';

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function createEditor(
  overrides: Partial<Parameters<typeof createMentionEditor>[0]> = {},
): { editor: MentionEditorInstance; container: HTMLElement } {
  const container = makeContainer();
  const editor = createMentionEditor({
    container,
    users: ALL_USERS,
    ...overrides,
  });
  return { editor, container };
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ─── setDisabled ──────────────────────────────────────────────────────────────

describe('setDisabled', () => {
  it('toggles contentEditable on the editable element', () => {
    const { editor } = createEditor();
    expect(editor.el.contentEditable).toBe('true');

    editor.setDisabled(true);
    expect(editor.el.contentEditable).toBe('false');

    editor.setDisabled(false);
    expect(editor.el.contentEditable).toBe('true');
    editor.destroy();
  });

  it('starts disabled when option is true', () => {
    const { editor } = createEditor({ disabled: true });
    expect(editor.el.contentEditable).toBe('false');
    editor.destroy();
  });
});

// ─── el ───────────────────────────────────────────────────────────────────────

describe('el', () => {
  it('exposes the contentEditable DOM element', () => {
    const { editor } = createEditor();
    expect(editor.el).toBeInstanceOf(HTMLElement);
    expect(editor.el.getAttribute('role')).toBe('textbox');
    editor.destroy();
  });

  it('is the same element as the one inside the container', () => {
    const { editor, container } = createEditor();
    const found = container.querySelector('[contenteditable]');
    expect(editor.el).toBe(found);
    editor.destroy();
  });
});

// ─── onFocus / onBlur ─────────────────────────────────────────────────────────

describe('onFocus / onBlur', () => {
  it('calls onFocus when the editable receives focus', () => {
    const onFocus = vi.fn();
    const { editor } = createEditor({ onFocus });
    editor.el.dispatchEvent(new Event('focus'));
    expect(onFocus).toHaveBeenCalledTimes(1);
    editor.destroy();
  });

  it('calls onBlur when the editable loses focus', () => {
    const onBlur = vi.fn();
    const { editor } = createEditor({ onBlur });
    editor.el.dispatchEvent(new Event('blur'));
    expect(onBlur).toHaveBeenCalledTimes(1);
    editor.destroy();
  });
});

// ─── mentionedUserIds ─────────────────────────────────────────────────────────

describe('mentionedUserIds in callback meta', () => {
  it('includes de-duplicated user IDs', () => {
    const onChange = vi.fn();
    const { editor } = createEditor({ onChange });
    editor.setNodes(
      [
        mention(alice),
        text(' and '),
        mention(bob),
        text(' and '),
        mention(alice),
      ],
      true,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    const meta = onChange.mock.calls[0]![1];
    expect(meta.mentionedUserIds).toEqual(['u1', 'u2']);
    editor.destroy();
  });

  it('is empty when there are no mentions', () => {
    const onChange = vi.fn();
    const { editor } = createEditor({ onChange });
    editor.setNodes([text('just text')], true);
    const meta = onChange.mock.calls[0]![1];
    expect(meta.mentionedUserIds).toEqual([]);
    editor.destroy();
  });
});

// ─── defaultValue (persist format) ────────────────────────────────────────────

describe('parsePersist + setNodes for defaultValue pattern', () => {
  it('seeds editor from a persisted string', () => {
    const { editor } = createEditor();
    const persisted = 'Hey @{u1}, check this';
    editor.setNodes(parsePersist(persisted, ALL_USERS));

    const nodes = editor.getNodes();
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toEqual({ type: 'text', text: 'Hey ' });
    expect(nodes[1]).toMatchObject({
      type: 'mention',
      displayName: 'Alice Johnson',
    });
    expect(nodes[2]).toEqual({ type: 'text', text: ', check this' });

    // Round-trip back to persist format
    expect(serializeToPersist(nodes)).toBe(persisted);
    editor.destroy();
  });
});
