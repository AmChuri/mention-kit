/**
 * React hook example — useMentionEditor with a custom container.
 *
 * Shows:
 *  - useMentionEditor hook (BYO container element)
 *  - Wiring into a hand-rolled "textarea"-style div (Tailwind classes)
 *  - Live onChange display (text is the first arg)
 *  - Programmatic setNodes (loading a draft)
 *  - Accessing mentionedUsers from meta
 */

import { useState } from 'react';
import {
  useMentionEditor,
  type EditorNode,
  type MentionUser,
} from '@cursortag/mention-kit/react';

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
  const [liveText, setLiveText] = useState('');
  const [mentioned, setMentioned] = useState<MentionUser[]>([]);
  const [disabled, setDisabled] = useState(false);

  const editor = useMentionEditor({
    users: ALL_USERS,
    onChange: (text, { mentionedUsers }) => {
      setLiveText(text);
      setMentioned(mentionedUsers);
    },
    onSubmit: (text) => {
      alert(`Submitted: ${text}`);
      editor.clear();
    },
    disabled,
    placeholder: disabled ? 'Editor is disabled' : 'Write a comment…',
  });

  return (
    <div
      style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}
    >
      <h2>@cursortag/mention-kit · React hook</h2>

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

      {/* Live preview */}
      {liveText && (
        <div style={{ marginTop: 16, fontSize: 13 }}>
          <strong>Live text:</strong>{' '}
          <span style={{ fontFamily: 'monospace' }}>{liveText}</span>
          {mentioned.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <strong>Mentioned:</strong>{' '}
              {mentioned.map((u) => u.name).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
