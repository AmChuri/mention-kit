import { useRef, useState } from 'react';
import {
  MentionInput,
  RenderedMessage,
  serializeToPersist,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/react';
import { USERS } from '../data';

export function ReactComponentDemo() {
  const ref = useRef<MentionEditorInstance>(null);
  const [submitted, setSubmitted] = useState('');

  return (
    <div className="demo-live">
      <MentionInput
        ref={ref}
        users={USERS}
        placeholder="Write a comment… (type @ to mention)"
        onSubmit={(_text, { nodes }) => {
          setSubmitted(serializeToPersist(nodes));
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

      {submitted && (
        <div className="demo-output">
          {/* How it renders in a comment thread */}
          <span className="output-label">rendered</span>
          <RenderedMessage message={submitted} users={USERS} />
          {/* What you store */}
          <span className="output-label" style={{ marginTop: 8 }}>
            stored
          </span>
          <code>{submitted}</code>
        </div>
      )}
    </div>
  );
}
