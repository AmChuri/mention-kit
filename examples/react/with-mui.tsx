/**
 * React + MUI example — useMentionEditor inside a MUI Paper / OutlinedInput shell.
 *
 * Shows:
 *  - Adapting to a component library that you don't control
 *  - Passing containerRef via inputRef (MUI pattern)
 *  - Styling the chip/dropdown to feel native to MUI's theme
 *  - Submit button wired to the editor instance
 *
 * Dependencies (add to your project — NOT part of @cursortag/mention-kit):
 *   yarn add @mui/material @emotion/react @emotion/styled
 */

import { useRef } from 'react';
// These imports come from MUI in your actual project:
// import Box from '@mui/material/Box';
// import Button from '@mui/material/Button';
// import Paper from '@mui/material/Paper';
// import Typography from '@mui/material/Typography';

import {
  useMentionEditor,
  serializeToText,
  type MentionUser,
} from '@cursortag/mention-kit/react';

const USERS: MentionUser[] = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
];

/**
 * Wraps the editor in a MUI Paper that mimics OutlinedInput.
 * The key insight: useMentionEditor only needs a DOM element ref —
 * it does not care whether that element came from MUI or plain HTML.
 */
export function MuiExample() {
  const editor = useMentionEditor({
    users: USERS,
    placeholder: 'Write a comment…',
    onSubmit: (text) => {
      console.log('submitted:', text);
      editor.clear();
    },
  });

  return (
    // Replace the <div> tags below with their MUI equivalents in your project.
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      {/* MUI Paper equivalent */}
      <div
        style={
          {
            border: '1px solid rgba(0,0,0,0.23)',
            borderRadius: 4,
            padding: '14px 14px 10px',
            '&:hover': { borderColor: 'rgba(0,0,0,0.87)' },
          } as React.CSSProperties
        }
      >
        {/*
          MUI usage would look like:
            <Box
              ref={editor.containerRef}
              sx={{ minHeight: 80, fontSize: 14, outline: 'none' }}
            />

          Plain div used here so the file runs without MUI installed:
        */}
        <div
          ref={editor.containerRef}
          style={{ minHeight: 80, fontSize: 14, lineHeight: 1.6 }}
        />

        {/* Action row */}
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}
        >
          <button
            onClick={() => {
              const nodes = editor.getNodes();
              console.log('submitted:', serializeToText(nodes));
              editor.clear();
            }}
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* In a real MUI app, use FormHelperText: */}
      <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 14px 0' }}>
        Press @ to mention a teammate
      </p>
    </div>
  );
}
