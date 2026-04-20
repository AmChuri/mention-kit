import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMentionEditor,
  type MentionEditorInstance,
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
): { editor: MentionEditorInstance; container: HTMLElement } {
  const container = makeContainer();
  const editor = createMentionEditor({
    container,
    users: ALL_USERS,
    ...overrides,
  });
  return { editor, container };
}

// ── cleanup ─────────────────────────────────────────────────────────────────

afterEach(() => {
  document.body.innerHTML = '';
});

// ─── Instance shape ───────────────────────────────────────────────────────────

describe('createMentionEditor – instance', () => {
  it('returns an object with all expected methods', () => {
    const { editor } = createEditor();
    expect(typeof editor.getNodes).toBe('function');
    expect(typeof editor.setNodes).toBe('function');
    expect(typeof editor.focus).toBe('function');
    expect(typeof editor.clear).toBe('function');
    expect(typeof editor.destroy).toBe('function');
    expect(typeof editor.setPlaceholder).toBe('function');
    editor.destroy();
  });

  it('creates a contentEditable child inside the container', () => {
    const { editor, container } = createEditor();
    const editable = container.querySelector('[contenteditable]');
    expect(editable).toBeTruthy();
    editor.destroy();
  });
});

// ─── getNodes / setNodes ──────────────────────────────────────────────────────

describe('createMentionEditor – getNodes / setNodes', () => {
  it('getNodes returns empty array on a fresh editor', () => {
    const { editor } = createEditor();
    expect(editor.getNodes()).toEqual([]);
    editor.destroy();
  });

  it('setNodes populates the editor and getNodes reads them back', () => {
    const { editor } = createEditor();
    const nodes: EditorNode[] = [
      text('Hello '),
      mention(alice),
      text(' world'),
    ];
    editor.setNodes(nodes);
    const result = editor.getNodes();

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', text: 'Hello ' });
    expect(result[1]).toMatchObject({
      type: 'mention',
      displayName: 'Alice Johnson',
    });
    expect(result[2]).toEqual({ type: 'text', text: ' world' });
    editor.destroy();
  });

  it('setNodes with empty array clears content', () => {
    const { editor } = createEditor();
    editor.setNodes([text('something')]);
    editor.setNodes([]);
    expect(editor.getNodes()).toEqual([]);
    editor.destroy();
  });

  it('setNodes replaces previous content entirely', () => {
    const { editor } = createEditor();
    editor.setNodes([text('first')]);
    editor.setNodes([text('second')]);
    const result = editor.getNodes();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'text', text: 'second' });
    editor.destroy();
  });

  it('handles mention-only content (no text nodes)', () => {
    const { editor } = createEditor();
    editor.setNodes([mention(alice), mention(bob)]);
    const result = editor.getNodes();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: 'mention' });
    expect(result[1]).toMatchObject({ type: 'mention' });
    editor.destroy();
  });

  it('preserves user data through set/get round-trip', () => {
    const { editor } = createEditor();
    editor.setNodes([mention(alice)]);
    const result = editor.getNodes();
    const m = result[0] as Extract<EditorNode, { type: 'mention' }>;
    expect(m.user.id).toBe('u1');
    expect(m.user.name).toBe('Alice Johnson');
    expect(m.displayName).toBe('Alice Johnson');
    editor.destroy();
  });

  it('handles text with HTML-like content safely (no XSS)', () => {
    const { editor, container } = createEditor();
    editor.setNodes([text('<img src=x onerror=alert(1)>')]);
    // The raw HTML should NOT be parsed — it should be text content
    expect(container.querySelector('img')).toBeNull();
    const result = editor.getNodes();
    expect(result[0]).toEqual({
      type: 'text',
      text: '<img src=x onerror=alert(1)>',
    });
    editor.destroy();
  });
});

// ─── clear ────────────────────────────────────────────────────────────────────

describe('createMentionEditor – clear', () => {
  it('removes all content', () => {
    const { editor } = createEditor();
    editor.setNodes([text('hello'), mention(alice)]);
    editor.clear();
    expect(editor.getNodes()).toEqual([]);
    editor.destroy();
  });

  it('can be called on an already empty editor', () => {
    const { editor } = createEditor();
    editor.clear();
    expect(editor.getNodes()).toEqual([]);
    editor.destroy();
  });

  it('editor is still usable after clear', () => {
    const { editor } = createEditor();
    editor.clear();
    editor.setNodes([text('after clear')]);
    expect(editor.getNodes()).toHaveLength(1);
    editor.destroy();
  });
});

// ─── onChange callback ────────────────────────────────────────────────────────

describe('createMentionEditor – onChange', () => {
  it('fires onChange when setNodes is called with emit=true', () => {
    const onChange = vi.fn();
    const { editor } = createEditor({ onChange });
    editor.setNodes([text('test')], true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([{ type: 'text', text: 'test' }]);
    editor.destroy();
  });

  it('does NOT fire onChange when setNodes is called without emit', () => {
    const onChange = vi.fn();
    const { editor } = createEditor({ onChange });
    editor.setNodes([text('test')]);
    expect(onChange).not.toHaveBeenCalled();
    editor.destroy();
  });

  it('does NOT fire onChange when setNodes is called with emit=false', () => {
    const onChange = vi.fn();
    const { editor } = createEditor({ onChange });
    editor.setNodes([text('test')], false);
    expect(onChange).not.toHaveBeenCalled();
    editor.destroy();
  });
});

// ─── setPlaceholder ───────────────────────────────────────────────────────────

describe('createMentionEditor – setPlaceholder', () => {
  it('updates the placeholder text after creation', () => {
    const { editor, container } = createEditor({
      placeholder: 'initial',
    });
    editor.setPlaceholder('updated');
    const ph = container.querySelector('[aria-hidden]');
    expect(ph?.textContent).toBe('updated');
    editor.destroy();
  });
});

// ─── destroy ──────────────────────────────────────────────────────────────────

describe('createMentionEditor – destroy', () => {
  it('cleans up DOM inside the container', () => {
    const { editor, container } = createEditor();
    editor.setNodes([text('content')]);
    editor.destroy();
    // After destroy, the container should be empty or cleaned up
    const editable = container.querySelector('[contenteditable]');
    expect(editable).toBeNull();
  });

  it('can be called multiple times without throwing', () => {
    const { editor } = createEditor();
    editor.destroy();
    expect(() => editor.destroy()).not.toThrow();
  });
});

// ─── Custom palette ───────────────────────────────────────────────────────────

describe('createMentionEditor – palette option', () => {
  it('accepts a custom palette without error', () => {
    const { editor } = createEditor({
      palette: ['#ff0000', '#00ff00', '#0000ff'],
    });
    editor.setNodes([mention(bob)]); // bob has no user.color, so palette is used
    const result = editor.getNodes();
    expect(result).toHaveLength(1);
    editor.destroy();
  });
});

// ─── Dynamic users (getter) ──────────────────────────────────────────────────

describe('createMentionEditor – dynamic users', () => {
  it('reads users via a getter so the list can change', () => {
    let currentUsers = [alice];
    const container = makeContainer();
    const editor = createMentionEditor({
      container,
      get users() {
        return currentUsers;
      },
    });

    // Add more users dynamically
    currentUsers = [alice, bob, carol];

    // The editor should now see all three users
    // (We can't easily test the dropdown without simulating keypresses,
    // but the editor creation with a getter should not throw)
    expect(editor.getNodes).toBeDefined();
    editor.destroy();
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('createMentionEditor – edge cases', () => {
  it('handles very long text content', () => {
    const { editor } = createEditor();
    const longText = 'a'.repeat(10_000);
    editor.setNodes([text(longText)]);
    const result = editor.getNodes();
    expect(result[0]).toEqual({ type: 'text', text: longText });
    editor.destroy();
  });

  it('handles text with unicode / emoji', () => {
    const { editor } = createEditor();
    editor.setNodes([text('Hello 🎉 世界')]);
    const result = editor.getNodes();
    expect(result[0]).toEqual({ type: 'text', text: 'Hello 🎉 世界' });
    editor.destroy();
  });

  it('handles mention with unicode in displayName', () => {
    const unicodeUser = { id: 'u99', name: 'José García' };
    const { editor } = createEditor();
    editor.setNodes([mention(unicodeUser)]);
    const result = editor.getNodes();
    expect(result[0]).toMatchObject({
      type: 'mention',
      displayName: 'José García',
    });
    editor.destroy();
  });

  it('handles rapid set/get cycles', () => {
    const { editor } = createEditor();
    for (let i = 0; i < 100; i++) {
      editor.setNodes([text(`iteration ${i}`)]);
    }
    const result = editor.getNodes();
    expect(result[0]).toEqual({ type: 'text', text: 'iteration 99' });
    editor.destroy();
  });

  it('handles mixed mentions and text with special chars', () => {
    const { editor } = createEditor();
    editor.setNodes([
      text('Price: $100 & "free"'),
      mention(alice),
      text(' <end>'),
    ]);
    const result = editor.getNodes();
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', text: 'Price: $100 & "free"' });
    expect(result[2]).toEqual({ type: 'text', text: ' <end>' });
    editor.destroy();
  });
});
