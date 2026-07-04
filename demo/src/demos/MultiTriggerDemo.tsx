import { useMemo, useRef, useState } from 'react';
import {
  MentionInput,
  RenderedMessage,
  serializeToPersist,
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
  const [submitted, setSubmitted] = useState('');
  const [createdTags, setCreatedTags] = useState<MentionItem[]>([]);

  // For the rendered preview, resolve both known and just-created tags.
  const tagItems = useMemo(() => [...TAGS, ...createdTags], [createdTags]);

  return (
    <div className="demo-live">
      <MentionInput
        ref={ref}
        users={USERS}
        placeholder="Try @ people, # tags (create new ones!), or / commands…"
        triggers={[
          { trigger: '@', items: USERS, label: 'Mention someone' },
          {
            trigger: '#',
            items: TAGS,
            label: 'Add a tag',
            color: '#0891b2',
            // Creatable: type a new tag name and pick "Create …".
            onCreate: (query) => {
              const tag: MentionItem = {
                id: `t-${query.toLowerCase().replace(/\s+/g, '-')}`,
                name: query,
                color: '#0891b2',
              };
              setCreatedTags((prev) =>
                prev.some((t) => t.id === tag.id) ? prev : [...prev, tag],
              );
              return tag;
            },
          },
          {
            trigger: '/',
            items: searchCommands, // async
            serverFiltered: true,
            debounce: 200,
            label: 'Run a command',
            // Slash-command action: run instead of inserting a chip.
            onSelect: (item, ctx) => {
              if (item.id === 'c2')
                ctx.insertText(new Date().toISOString().slice(0, 10) + ' ');
              else ctx.insertText(`[${item.name}] `);
            },
          },
        ]}
        onSubmit={(_text, { nodes }) => {
          setSubmitted(serializeToPersist(nodes));
          ref.current?.clear();
        }}
        className="demo-editor"
      />

      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        <kbd>@</kbd> people · <kbd>#</kbd> tags (create new ones) · <kbd>/</kbd>{' '}
        commands (async + run an action) · <kbd>Enter</kbd> to submit
      </p>

      {submitted && (
        <div className="demo-output">
          <span className="output-label">rendered</span>
          <RenderedMessage
            message={submitted}
            users={USERS}
            triggerItems={[{ trigger: '#', items: tagItems }]}
          />
          <span className="output-label" style={{ marginTop: 8 }}>
            stored
          </span>
          <code>{submitted}</code>
        </div>
      )}
    </div>
  );
}
