import { useRef, useState } from 'react';
import {
  MentionInput,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/react';
import { USERS } from '../data';

export function ReactComponentDemo() {
  const ref = useRef<MentionEditorInstance>(null);
  const [output, setOutput] = useState('');

  return (
    <div className="demo-live">
      <MentionInput
        ref={ref}
        users={USERS}
        placeholder="Write a comment… (type @ to mention)"
        onSubmit={(text) => {
          setOutput(text);
          ref.current?.clear();
        }}
        className="demo-editor"
      />
      <div className="demo-actions">
        <button className="btn-ghost" onClick={() => ref.current?.clear()}>
          Clear
        </button>
        <button
          className="btn-ghost"
          onClick={() =>
            ref.current?.setNodes([
              { type: 'text', text: 'Hey ' },
              {
                type: 'mention',
                user: USERS[0]!,
                displayName: 'Alice Johnson',
              },
              { type: 'text', text: ', take a look at this.' },
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
