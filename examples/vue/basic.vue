<script setup lang="ts">
/**
 * Basic Vue example — drop-in MentionInput component.
 *
 * Shows:
 *  - Minimal setup
 *  - Handling @submit and @change emits
 *  - Imperative clear() via template ref
 *  - Serialising nodes to plain text / markdown
 */

import { ref } from 'vue';
import {
  MentionInput,
  serializeToMarkdown,
  serializeToText,
  type EditorNode,
  type MentionEditorInstance,
  type MentionUser,
} from '@cursortag/mention-kit/vue';

// ── Sample data ───────────────────────────────────────────────────────────────

const users: MentionUser[] = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering', color: '#7c3aed' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
  { id: 'u3', name: 'Carol White', meta: 'Product', color: '#0891b2' },
];

// ── State ─────────────────────────────────────────────────────────────────────

const editorRef = ref<MentionEditorInstance | null>(null);
const submitted = ref<EditorNode[]>([]);
const liveText = ref('');

// ── Handlers ──────────────────────────────────────────────────────────────────

function onSubmit(nodes: EditorNode[]) {
  submitted.value = nodes;
  // Clear the editor after submit using the exposed method.
  editorRef.value?.clear();
}

function onChange(nodes: EditorNode[]) {
  liveText.value = serializeToText(nodes);
}
</script>

<template>
  <div class="example">
    <h2>@cursortag/mention-kit · Vue basic</h2>

    <!--
      MentionInput renders a plain <div>.
      Style it with any class, style, or CSS-in-JS — the library adds no opinions.
    -->
    <MentionInput
      ref="editorRef"
      :users="users"
      placeholder="Write a comment… (@ to mention)"
      class="editor"
      @submit="onSubmit"
      @change="onChange"
    />

    <p class="hint">
      Press <kbd>Enter</kbd> to submit · <kbd>Shift+Enter</kbd> for a new line
    </p>

    <!-- Live text -->
    <p v-if="liveText" class="live">
      <strong>Live:</strong> {{ liveText }}
    </p>

    <!-- Submitted output -->
    <div v-if="submitted.length" class="output">
      <h3>Last submitted</h3>

      <table>
        <tr>
          <td>plain text</td>
          <td><code>{{ serializeToText(submitted) }}</code></td>
        </tr>
        <tr>
          <td>markdown</td>
          <td><code>{{ serializeToMarkdown(submitted) }}</code></td>
        </tr>
      </table>

      <details>
        <summary>raw nodes</summary>
        <pre>{{ JSON.stringify(submitted, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<style scoped>
.example {
  max-width: 600px;
  margin: 2rem auto;
  font-family: sans-serif;
}

.editor {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  min-height: 80px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}

.hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.live {
  font-size: 13px;
  margin-top: 12px;
}

.output {
  margin-top: 24px;
}

.output table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.output td {
  padding: 4px 8px;
  border-bottom: 1px solid #e5e7eb;
}

.output td:first-child {
  color: #6b7280;
  width: 100px;
}

details {
  margin-top: 12px;
}

summary {
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
}

pre {
  font-size: 11px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
}
</style>
