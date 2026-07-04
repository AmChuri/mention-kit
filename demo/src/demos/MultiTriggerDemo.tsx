import { useRef, useState } from 'react';
import {
  MentionInput,
  type MentionEditorInstance,
  type MentionItem,
} from '@cursortag/mention-kit/react';
import { USERS } from '../data';

// ── Extra data sources for the # and / triggers ────────────────────────────────

const TAGS: MentionItem[] = [
  { id: 't1', name: 'bug', color: '#dc2626' },
  { id: 't2', name: 'feature', color: '#2563eb' },
  { id: 't3', name: 'docs', color: '#059669' },
  { id: 't4', name: 'urgent', color: '#d97706' },
];

const COMMANDS: MentionItem[] = [
  { id: 'c1', name: 'assign', meta: 'Assign to a teammate' },
  { id: 'c2', name: 'due', meta: 'Set a due date' },
  { id: 'c3', name: 'label', meta: 'Add a label' },
  { id: 'c4', name: 'archive', meta: 'Archive this thread' },
];

// Fake async "server" search for the / command trigger.
const searchCommands = (query: string): Promise<MentionItem[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const q = query.toLowerCase();
      resolve(COMMANDS.filter((c) => c.name.toLowerCase().includes(q)));
    }, 350);
  });

export function MultiTriggerDemo() {
  const ref = useRef<MentionEditorInstance>(null);
  const [output, setOutput] = useState('');

  return (
    <div className="demo-live">
      <MentionInput
        ref={ref}
        users={USERS}
        placeholder="Try @ people, # tags, or / commands…"
        triggers={[
          { trigger: '@', items: USERS, label: 'Mention someone' },
          { trigger: '#', items: TAGS, label: 'Add a tag' },
          {
            trigger: '/',
            items: searchCommands, // async
            serverFiltered: true,
            debounce: 200,
            label: 'Run a command',
          },
        ]}
        onSubmit={(text) => {
          setOutput(text);
          ref.current?.clear();
        }}
        className="demo-editor"
      />

      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        <kbd>@</kbd> people · <kbd>#</kbd> tags · <kbd>/</kbd> commands (async,
        debounced) · <kbd>Enter</kbd> to submit
      </p>

      {output && (
        <div className="demo-output">
          <span className="output-label">submitted</span>
          <code>{output}</code>
        </div>
      )}
    </div>
  );
}
