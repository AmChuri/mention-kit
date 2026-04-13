/**
 * Basic React example — drop-in MentionInput component.
 *
 * Shows:
 *  - Minimal setup
 *  - Reading submitted content
 *  - Resetting after submit
 *  - Serialising nodes to plain text / markdown
 */

import { useRef, useState } from 'react';
import {
  MentionInput,
  serializeToMarkdown,
  serializeToText,
  type EditorNode,
  type MentionEditorInstance,
  type MentionUser,
} from 'mention-editor/react';

// ── Sample data ───────────────────────────────────────────────────────────────

const USERS: MentionUser[] = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering', color: '#7c3aed' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
  { id: 'u3', name: 'Carol White', meta: 'Product', color: '#0891b2' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function BasicExample() {
  const editorRef = useRef<MentionEditorInstance>(null);
  const [submitted, setSubmitted] = useState<EditorNode[]>([]);

  const handleSubmit = (nodes: EditorNode[]) => {
    setSubmitted(nodes);
    editorRef.current?.clear();
  };

  return (
    <div
      style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}
    >
      <h2>mention-editor · React basic</h2>

      {/* The editor — style the wrapper div however you like */}
      <MentionInput
        ref={editorRef}
        users={USERS}
        placeholder="Write a comment… (@ to mention)"
        onSubmit={handleSubmit}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '10px 12px',
          minHeight: 80,
          fontSize: 14,
          lineHeight: 1.6,
          outline: 'none',
        }}
      />

      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        Press <kbd>Enter</kbd> to submit · <kbd>Shift+Enter</kbd> for a new line
      </p>

      {/* Show what was submitted */}
      {submitted.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>Last submitted</h3>

          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>
                  format
                </th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px 8px', color: '#6b7280' }}>
                  plain text
                </td>
                <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>
                  {serializeToText(submitted)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', color: '#6b7280' }}>
                  markdown
                </td>
                <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>
                  {serializeToMarkdown(submitted)}
                </td>
              </tr>
            </tbody>
          </table>

          <details style={{ marginTop: 12 }}>
            <summary
              style={{ cursor: 'pointer', fontSize: 12, color: '#6b7280' }}
            >
              raw nodes
            </summary>
            <pre
              style={{
                fontSize: 11,
                background: '#f9fafb',
                padding: 12,
                borderRadius: 4,
              }}
            >
              {JSON.stringify(submitted, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
