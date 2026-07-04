<script setup lang="ts">
/**
 * Vue hovercards + themes example — renderCommentMessage + attachHovercards (v0.2.0+).
 *
 * Shows:
 *  - Rendering a stored `@{userId}` message into your own container
 *  - `attachHovercards(root, users, opts)` — profile card on hover; returns a cleanup fn
 *  - Copyable fields + a "copy user" button
 *  - Theming chips (container `--mk-*` vars via applyTheme) and the card (opts.theme)
 *  - Proper cleanup on unmount and on theme change
 *
 * (Vue has no <RenderedMessage> component — you own the container, so you call
 *  renderCommentMessage + attachHovercards yourself. React ships the component.)
 */

import { onMounted, onUnmounted, ref, watch } from 'vue';
import {
  renderCommentMessage,
  attachHovercards,
  applyTheme,
  type MentionTheme,
  type MentionUser,
} from '@cursortag/mention-kit/vue';

// ── Sample data ───────────────────────────────────────────────────────────────

const users: MentionUser[] = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    meta: 'Staff Engineer · Engineering',
    color: '#7c3aed',
    email: 'alice@acme.com',
    details: [
      { label: 'Team', value: 'Platform' },
      { label: 'Slack', value: '@alice', href: 'https://slack.com' },
    ],
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    meta: 'Product Designer · Design',
    color: '#0891b2',
    email: 'bob@acme.com',
    details: [{ label: 'Team', value: 'Design Systems' }],
  },
  {
    id: 'u3',
    name: 'Carol White',
    meta: 'PM · Product',
    color: '#059669',
    email: 'carol@acme.com',
  },
];

const STORED =
  'Nice work @{u1}! Can you sync with @{u2} on the new tokens, ' +
  'and loop in @{u3} for the rollout plan?';

// ── State ─────────────────────────────────────────────────────────────────────

const surface = ref<HTMLElement | null>(null);
const dark = ref(false);
let cleanup: (() => void) | null = null;

// Render the stored message and (re)wire hovercards for the current theme.
function render() {
  const host = surface.value;
  if (!host) return;

  cleanup?.(); // tear down the previous card + listeners
  host.innerHTML = '';

  const theme: MentionTheme = { preset: dark.value ? 'dark' : 'light' };
  applyTheme(host, theme); // chips inherit --mk-* from the container

  for (const part of renderCommentMessage(STORED, users)) {
    host.appendChild(
      typeof part === 'string' ? document.createTextNode(part) : part,
    );
  }

  cleanup = attachHovercards(host, users, {
    theme,
    copyFields: true,
    copyUser: (u) => `${u.name} <${u.email ?? ''}>`.trim(),
  });
}

onMounted(render);
watch(dark, render);
onUnmounted(() => cleanup?.());
</script>

<template>
  <div class="example">
    <h2>@cursortag/mention-kit · Vue hovercards + themes</h2>

    <div class="controls">
      <button :aria-pressed="dark" @click="dark = !dark">
        {{ dark ? '☀️ Light theme' : '🌙 Dark theme' }}
      </button>
      <span class="hint"
        >hover a mention → profile card with copyable fields</span
      >
    </div>

    <!-- You own this container; the library renders chips + a floating card. -->
    <div ref="surface" class="surface" :class="{ dark }" />

    <p class="hint">
      Chips, the card, copy buttons and links all restyle from
      <code>--mk-*</code> CSS variables.
    </p>
  </div>
</template>

<style scoped>
.example {
  max-width: 600px;
  margin: 2rem auto;
  font-family: sans-serif;
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.hint {
  font-size: 12px;
  color: #6b7280;
}

.surface {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 14px;
  line-height: 1.7;
  font-size: 14px;
}

.surface.dark {
  background: #0b1220;
  color: #e2e8f0;
  border-color: #1e293b;
}

code {
  font-family: monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
