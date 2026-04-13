import { useState } from 'react';
import {
  useMentionEditor,
  serializeToText,
  type EditorNode,
} from 'mention-editor/react';
import { USERS } from '../data';

export function ReactHookDemo() {
  const [output, setOutput] = useState('');

  const editor = useMentionEditor({
    users: USERS,
    onSubmit: (nodes: EditorNode[]) => {
      setOutput(serializeToText(nodes));
      editor.clear();
    },
    placeholder: 'Write a comment… (type @ to mention)',
  });

  return (
    <div className="demo-live">
      {/* containerRef goes on any element — this is just a plain div */}
      <div ref={editor.containerRef} className="demo-editor" />

      <div className="demo-actions">
        <button className="btn-ghost" onClick={() => editor.clear()}>
          Clear
        </button>
        <button className="btn-ghost" onClick={() => editor.focus()}>
          Focus
        </button>
        <button
          className="btn-ghost"
          onClick={() =>
            editor.setNodes([
              { type: 'text', text: 'Can ' },
              { type: 'mention', user: USERS[1]!, displayName: 'Bob Smith' },
              { type: 'text', text: ' review this?' },
            ])
          }
        >
          Load draft
        </button>
      </div>

      {output && (
        <div className="demo-output">
          <span className="output-label">submitted</span>
          <code>{output}</code>
        </div>
      )}
    </div>
  );
}
