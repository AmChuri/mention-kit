export const REACT_COMPONENT_SNIPPET = `\
import { useRef } from 'react';
import { MentionInput, type MentionEditorInstance } from '@cursortag/mention-kit/react';

const users = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith',     meta: 'Design' },
];

function CommentBox() {
  const ref = useRef<MentionEditorInstance>(null);

  return (
    <MentionInput
      ref={ref}
      users={users}
      placeholder="Write a comment…"
      onSubmit={(text, { mentionedUsers }) => {
        console.log(text);               // "Hey @Alice Johnson, check this"
        console.log(mentionedUsers);      // [{ id: 'u1', name: 'Alice Johnson', ... }]
        ref.current?.clear();
      }}
      className="editor"
    />
  );
}`;

export const REACT_HOOK_SNIPPET = `\
import { useMentionEditor } from '@cursortag/mention-kit/react';

function CommentBox() {
  const editor = useMentionEditor({
    users,
    onSubmit: (text) => {
      save(text);
      editor.clear();
    },
    // Access meta when you need it:
    // onChange: (text, { nodes, mentionedUsers }) => { ... },
  });

  // Attach containerRef to any element — MUI Box, shadcn div, etc.
  return (
    <div ref={editor.containerRef} className="editor" />
  );
}

// MUI example:
// <Box ref={editor.containerRef} sx={{ border: 1, p: 1.5, minHeight: 80 }} />

// shadcn example:
// <div ref={editor.containerRef}
//   className="rounded-md border border-input px-3 py-2 text-sm" />`;

export const MULTI_TRIGGER_SNIPPET = `\
import { MentionInput } from '@cursortag/mention-kit/react';

const people = [{ id: 'u1', name: 'Alice Johnson' }, /* … */];
const tags   = [{ id: 't1', name: 'bug' }, { id: 't2', name: 'feature' }];

// One editor, three triggers — @ people, # tags, / async commands.
<MentionInput
  users={people}
  placeholder="Try @ people, # tags, or / commands…"
  triggers={[
    { trigger: '@', items: people, label: 'Mention someone' },
    { trigger: '#', items: tags,   label: 'Add a tag' },
    {
      trigger: '/',
      debounce: 200,            // debounce keystrokes
      serverFiltered: true,     // results already filtered server-side
      items: async (query) => {
        const res = await fetch(\`/api/commands?q=\${query}\`);
        return res.json();      // MentionItem[]
      },
    },
  ]}
  onSubmit={(text) => save(text)}   // "Fix @Alice's #bug"
/>;

// Stored as tokens: "Fix @{u1}'s #{t1}" — re-render with triggerItems:
// renderCommentMessage(stored, people, palette, [{ trigger: '#', items: tags }])`;

export const HOVERCARD_SNIPPET = `\
import { useState } from 'react';
import { RenderedMessage } from '@cursortag/mention-kit/react';

const users = [
  {
    id: 'u1', name: 'Alice Johnson', meta: 'Staff Engineer',
    email: 'alice@acme.com',
    details: [
      { label: 'Team',  value: 'Platform' },
      { label: 'Slack', value: '@alice', href: 'https://slack.com' },
    ],
  },
  // …
];

function Comment({ stored }: { stored: string }) {
  const [dark, setDark] = useState(false);

  // Hover a mention → card with avatar, meta, and copyable fields.
  // Theme with a preset, a { chipBg, cardBg, … } object, or plain --mk-* CSS.
  return (
    <RenderedMessage
      message={stored}
      users={users}
      hovercard
      theme={dark ? { preset: 'dark' } : { preset: 'light' }}
    />
  );
}`;

export const VUE_COMPONENT_SNIPPET = `\
<script setup lang="ts">
import { ref } from 'vue';
import { MentionInput, type MentionEditorInstance } from '@cursortag/mention-kit/vue';

const editorRef = ref<MentionEditorInstance | null>(null);
const users = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith',     meta: 'Design' },
];
</script>

<template>
  <MentionInput
    ref="editorRef"
    :users="users"
    placeholder="Write a comment…"
    class="editor"
    @submit="(text, { mentionedUsers }) => {
      save(text);
      editorRef?.clear();
    }"
    @change="(text) => console.log(text)"
  />
</template>`;

export const VUE_COMPOSABLE_SNIPPET = `\
<script setup lang="ts">
import { computed } from 'vue';
import { useMentionEditor } from '@cursortag/mention-kit/vue';

// Reactive getter — editor always reads the latest list
const editor = useMentionEditor({
  get users() { return filteredUsers.value; },
  onSubmit: (text) => {
    save(text);
    editor.clear();
  },
  // Full meta available when needed:
  // onChange: (text, { nodes, mentionedUsers }) => { ... },
});
</script>

<template>
  <!--
    containerRef works with native elements and any
    component library that forwards native DOM refs.

    Element Plus:  <el-input :ref="editor.containerRef" />
    Vuetify:       <v-textarea :ref="editor.containerRef" />
  -->
  <div :ref="editor.containerRef" class="editor" />
</template>`;
