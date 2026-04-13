/**
 * React hook example — useMentionEditor with a custom container.
 *
 * Shows:
 *  - useMentionEditor hook (BYO container element)
 *  - Wiring into a hand-rolled "textarea"-style div (Tailwind classes)
 *  - Live onChange display
 *  - Programmatic setNodes (loading a draft)
 *  - Dynamic users list (filtering as you type is handled by the editor;
 *    this shows how to swap the full list reactively)
 */

import { useState, useRef } from 'react';
import {
  useMentionEditor,
  serializeToText,
  type EditorNode,
  type MentionUser,
} from 'mention-editor/react';

// ── Types ─────────────────────────────────────────────────────────────────────

const ALL_USERS: MentionUser[] = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
  { id: 'u3', name: 'Carol White', meta: 'Product' },
  { id: 'u4', name: 'Dan Brown', meta: 'Marketing' },
];

const DRAFT: EditorNode[] = [
  { type: 'text', text: 'Hey ' },
  { type: 'mention', user: ALL_USERS[0]!, displayName: 'Alice Johnson' },
  { type: 'text', text: ', can you review this?' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function HookExample() {
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [disabled, setDisabled] = useState(false);

  // useMentionEditor — hand the containerRef to whatever element you want.
  const editor = useMentionEditor({
    users: ALL_USERS,
    onChange: setNodes,
    onSubmit: (submitted) => {
      alert(`Submitted: ${serializeToText(submitted)}`);
      editor.clear();
    },
    disabled,
    placeholder: disabled ? 'Editor is disabled' : 'Write a comment…',
  });

  // ── Tailwind-style container ───────────────────────────────────────────────
  // The ref goes on the actual editing surface. Wrap it however you want.

  return (
    <div
      style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}
    >
      <h2>mention-editor · React hook</h2>

      {/* Custom container — style anything around the ref'd element */}
      <div
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '6px 10px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          <button onClick={() => editor.setNodes(DRAFT)}>Load draft</button>
          <button onClick={() => editor.clear()}>Clear</button>
          <button onClick={() => editor.focus()}>Focus</button>
          <label style={{ marginLeft: 'auto', fontSize: 13 }}>
            <input
              type="checkbox"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />{' '}
            disabled
          </label>
        </div>

        {/*
          This div is the editor surface.
          containerRef is attached here — the library takes over the inside.
        */}
        <div
          ref={editor.containerRef}
          style={{
            padding: '10px 12px',
            minHeight: 80,
            fontSize: 14,
            lineHeight: 1.6,
            opacity: disabled ? 0.5 : 1,
          }}
        />
      </div>

      {/* Live node preview */}
      {nodes.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 13 }}>
          <strong>Live text:</strong>{' '}
          <span style={{ fontFamily: 'monospace' }}>
            {serializeToText(nodes)}
          </span>
        </div>
      )}
    </div>
  );
}
