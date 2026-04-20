<script setup lang="ts">
/**
 * Vue composable example — useMentionEditor with a custom container.
 *
 * Shows:
 *  - useMentionEditor (BYO container — you control the wrapping markup)
 *  - Reactive users list (swap the list and the editor picks it up instantly)
 *  - Programmatic setNodes (loading a draft)
 *  - Integrating with a "native-feeling" toolbar
 *  - Wiring to an Element Plus / Vuetify-style shell (pattern shown in comments)
 */

import { computed, ref } from 'vue';
import {
  useMentionEditor,
  serializeToText,
  type EditorNode,
  type MentionUser,
} from '@cursortag/mention-kit/vue';

// ── Sample data ───────────────────────────────────────────────────────────────

const ALL_USERS: MentionUser[] = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
  { id: 'u3', name: 'Carol White', meta: 'Product' },
  { id: 'u4', name: 'Dan Brown', meta: 'Marketing' },
];

const DRAFT: EditorNode[] = [
  { type: 'text', text: 'Hey ' },
  { type: 'mention', user: ALL_USERS[0]!, displayName: 'Alice Johnson' },
  { type: 'text', text: ', can you review this?' },
];

// ── State ─────────────────────────────────────────────────────────────────────

const teamFilter = ref<'all' | 'eng' | 'design'>('all');
const liveNodes = ref<EditorNode[]>([]);

// Reactive computed users — the getter in useMentionEditor always reads the
// latest value, so swapping this list is picked up with no re-mount.
const visibleUsers = computed<MentionUser[]>(() => {
  if (teamFilter.value === 'eng') return ALL_USERS.filter((u) => u.meta === 'Engineering');
  if (teamFilter.value === 'design') return ALL_USERS.filter((u) => u.meta === 'Design');
  return ALL_USERS;
});

// ── Composable ────────────────────────────────────────────────────────────────

const editor = useMentionEditor({
  // Getter ensures the editor always reads the latest computed list.
  get users() {
    return visibleUsers.value;
  },
  onChange: (nodes) => {
    liveNodes.value = nodes;
  },
  onSubmit: (nodes) => {
    alert(`Submitted: ${serializeToText(nodes)}`);
    editor.clear();
  },
  placeholder: 'Write a comment…',
});

// ── Handlers ──────────────────────────────────────────────────────────────────

function loadDraft() {
  editor.setNodes(DRAFT);
  editor.focus();
}
</script>

<template>
  <div class="example">
    <h2>@cursortag/mention-kit · Vue composable</h2>

    <!-- Custom shell — you own 100% of the markup and styling -->
    <div class="shell">
      <!-- Toolbar -->
      <div class="toolbar">
        <span class="label">Show team:</span>
        <button
          v-for="opt in [
            { value: 'all', label: 'All' },
            { value: 'eng', label: 'Engineering' },
            { value: 'design', label: 'Design' },
          ]"
          :key="opt.value"
          :class="['filter-btn', { active: teamFilter === opt.value }]"
          @click="teamFilter = opt.value as typeof teamFilter.value"
        >
          {{ opt.label }}
        </button>

        <div class="spacer" />

        <button @click="loadDraft">Load draft</button>
        <button @click="editor.clear()">Clear</button>
      </div>

      <!--
        The editing surface.
        containerRef goes here — works with any element, including component-
        library wrappers that forward native refs.

        Element Plus equivalent:
          <el-input :ref="editor.containerRef" type="textarea" />

        Vuetify equivalent:
          <v-textarea :ref="editor.containerRef" />
      -->
      <div ref="editor.containerRef" class="surface" />
    </div>

    <!-- Live output -->
    <div v-if="liveNodes.length" class="preview">
      <span class="label">Live text:</span>
      <code>{{ serializeToText(liveNodes) }}</code>
    </div>
  </div>
</template>

<style scoped>
.example {
  max-width: 600px;
  margin: 2rem auto;
  font-family: sans-serif;
}

.shell {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.label {
  font-size: 12px;
  color: #6b7280;
}

.spacer {
  flex: 1;
}

.filter-btn {
  padding: 2px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
}

.filter-btn.active {
  background: #7c3aed;
  color: #fff;
  border-color: #7c3aed;
}

.surface {
  padding: 10px 12px;
  min-height: 80px;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
}

.preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
}

code {
  font-family: monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
