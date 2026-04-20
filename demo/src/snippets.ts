export const REACT_COMPONENT_SNIPPET = `\
import { useRef } from 'react';
import {
  MentionInput,
  serializeToText,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/react';

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
      placeholder="Write a comment… (@ to mention)"
      onSubmit={(nodes) => {
        console.log(serializeToText(nodes));
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
    onSubmit: (nodes) => {
      save(nodes);
      editor.clear();
    },
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

export const VUE_COMPONENT_SNIPPET = `\
<script setup lang="ts">
import { ref } from 'vue';
import {
  MentionInput,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/vue';

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
    @submit="(nodes) => { save(nodes); editorRef?.clear(); }"
    @change="(nodes) => console.log(nodes)"
  />
</template>`;

export const VUE_COMPOSABLE_SNIPPET = `\
<script setup lang="ts">
import { computed } from 'vue';
import { useMentionEditor } from '@cursortag/mention-kit/vue';

// Reactive getter — editor always reads the latest list
const editor = useMentionEditor({
  get users() { return filteredUsers.value; },
  onSubmit: (nodes) => {
    save(nodes);
    editor.clear();
  },
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
