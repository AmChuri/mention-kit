# mention-editor

A headless, zero-dependency TypeScript mention editor built on a plain `contentEditable` div.  
Works with React, Vue 3, or vanilla JS — bring your own styles.

---

## Features

- **Zero dependencies** — no framework required for the core
- **Dual CJS + ESM** builds with full TypeScript types
- **React** — `<MentionInput />` component and `useMentionEditor()` hook
- **Vue 3** — `<MentionInput />` component and `useMentionEditor()` composable
- **Headless** — renders a plain `<div>`, style with Tailwind / MUI / shadcn / anything
- **Keyboard-first** — `@` to open, `↑↓` to navigate, `Enter`/`Tab` to select, `Escape` to close
- **Custom palettes** — per-user colors or a shared palette
- **Persistence format** — `@{userId}` tokens for easy storage and re-render

---

## Installation

```bash
# npm
npm install mention-editor

# yarn
yarn add mention-editor

# pnpm
pnpm add mention-editor
```

React and Vue are optional peer dependencies — install only what you use:

```bash
# React
yarn add mention-editor react

# Vue
yarn add mention-editor vue
```

---

## Quick start

### React

```tsx
import { MentionInput } from 'mention-editor/react';

const users = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
];

function CommentBox() {
  return (
    <MentionInput
      users={users}
      placeholder="Write a comment… (@ to mention)"
      onSubmit={(nodes) => console.log(nodes)}
      className="rounded border p-2 min-h-[80px]"
    />
  );
}
```

### Vue 3

```vue
<script setup lang="ts">
import { MentionInput } from 'mention-editor/vue';

const users = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
];
</script>

<template>
  <MentionInput
    :users="users"
    placeholder="Write a comment…"
    class="rounded border p-2 min-h-[80px]"
    @submit="(nodes) => console.log(nodes)"
  />
</template>
```

### Vanilla JS

```ts
import { createMentionEditor } from 'mention-editor';

const editor = createMentionEditor({
  container: document.getElementById('editor')!,
  users: [
    { id: 'u1', name: 'Alice Johnson' },
    { id: 'u2', name: 'Bob Smith' },
  ],
  placeholder: 'Write a comment…',
  onSubmit: (nodes) => console.log(nodes),
});

// Cleanup
editor.destroy();
```

---

## React

### `<MentionInput />` — drop-in component

```tsx
import { useRef } from 'react';
import {
  MentionInput,
  serializeToText,
  type MentionEditorInstance,
} from 'mention-editor/react';

function CommentBox() {
  const ref = useRef<MentionEditorInstance>(null);

  return (
    <>
      <MentionInput
        ref={ref}
        users={users}
        placeholder="Write a comment…"
        onSubmit={(nodes) => {
          console.log(serializeToText(nodes));
          ref.current?.clear();
        }}
        // Style with any approach — Tailwind, inline styles, CSS modules…
        className="rounded border border-gray-300 p-3 min-h-[80px] text-sm"
      />
      <button onClick={() => ref.current?.clear()}>Clear</button>
    </>
  );
}
```

**Props**

| Prop             | Type                              | Description                       |
| ---------------- | --------------------------------- | --------------------------------- |
| `users`          | `MentionUser[]`                   | List of mentionable users         |
| `placeholder`    | `string`                          | Placeholder text                  |
| `onSubmit`       | `(nodes: EditorNode[]) => void`   | Called on `Enter`                 |
| `onChange`       | `(nodes: EditorNode[]) => void`   | Called on every edit              |
| `disabled`       | `boolean`                         | Disables editing                  |
| `maxSuggestions` | `number`                          | Max dropdown items (default `8`)  |
| `palette`        | `string[]`                        | Fallback colors for user chips    |
| `defaultNodes`   | `EditorNode[]`                    | Initial content                   |
| `className`      | `string`                          | CSS class on the container div    |
| `style`          | `CSSProperties`                   | Inline style on the container div |
| `renderUser`     | `(user, selected) => HTMLElement` | Custom dropdown row renderer      |

**Ref methods** (`useRef<MentionEditorInstance>`)

| Method                   | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `getNodes()`             | Returns current document as `EditorNode[]`      |
| `setNodes(nodes, emit?)` | Replace content; pass `true` to fire `onChange` |
| `clear()`                | Clear all content                               |
| `focus()`                | Move focus into the editor                      |
| `setPlaceholder(text)`   | Update placeholder after mount                  |

---

### `useMentionEditor()` — hook for custom containers

Use this when you need to embed the editor inside a MUI `<Box>`, shadcn `<Textarea>`, or any element you control.

```tsx
import { useMentionEditor, serializeToText } from 'mention-editor/react';

function MyEditor() {
  const editor = useMentionEditor({
    users,
    onChange: (nodes) => console.log(serializeToText(nodes)),
    onSubmit: (nodes) => {
      save(nodes);
      editor.clear();
    },
  });

  return (
    // Attach containerRef to any element — the library takes over its contents
    <div
      ref={editor.containerRef}
      className="rounded border border-gray-300 p-3 min-h-[80px]"
    />
  );
}
```

**MUI example**

```tsx
// The ref works with any component that forwards a native DOM ref
<Box
  ref={editor.containerRef}
  sx={{
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    p: 1.5,
    minHeight: 80,
  }}
/>
```

**shadcn / Radix example**

```tsx
<div
  ref={editor.containerRef}
  className={cn(
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
    'ring-offset-background focus-within:ring-2 focus-within:ring-ring',
  )}
/>
```

**Returns**

| Field                    | Type                  | Description                      |
| ------------------------ | --------------------- | -------------------------------- |
| `containerRef`           | `Ref<HTMLDivElement>` | Attach to your container element |
| `getNodes()`             | `() => EditorNode[]`  | Read current content             |
| `setNodes(nodes, emit?)` | `function`            | Replace content                  |
| `clear()`                | `function`            | Clear all content                |
| `focus()`                | `function`            | Focus the editor                 |
| `setPlaceholder(text)`   | `function`            | Update placeholder               |

---

## Vue 3

### `<MentionInput />` — drop-in component

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { MentionInput, type MentionEditorInstance } from 'mention-editor/vue';

const editorRef = ref<MentionEditorInstance | null>(null);
</script>

<template>
  <MentionInput
    ref="editorRef"
    :users="users"
    placeholder="Write a comment…"
    class="rounded border border-gray-300 p-3 min-h-[80px] text-sm"
    @submit="onSubmit"
    @change="onChange"
  />
  <button @click="editorRef?.clear()">Clear</button>
</template>
```

**Props**

| Prop             | Type            | Description                      |
| ---------------- | --------------- | -------------------------------- |
| `users`          | `MentionUser[]` | List of mentionable users        |
| `placeholder`    | `string`        | Placeholder text                 |
| `disabled`       | `boolean`       | Disables editing                 |
| `maxSuggestions` | `number`        | Max dropdown items (default `8`) |
| `palette`        | `string[]`      | Fallback colors for user chips   |
| `defaultNodes`   | `EditorNode[]`  | Initial content                  |

**Emits**

| Event    | Payload        | Description         |
| -------- | -------------- | ------------------- |
| `change` | `EditorNode[]` | Fires on every edit |
| `submit` | `EditorNode[]` | Fires on `Enter`    |

**Exposed methods** (via template ref)

Same as the React ref methods — `getNodes`, `setNodes`, `clear`, `focus`, `setPlaceholder`.

---

### `useMentionEditor()` — composable for custom containers

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useMentionEditor } from 'mention-editor/vue';

// Reactive users — pass a getter so the editor always reads the latest list
const editor = useMentionEditor({
  get users() {
    return filteredUsers.value;
  },
  onSubmit: (nodes) => {
    save(nodes);
    editor.clear();
  },
});
</script>

<template>
  <!-- Attach containerRef to any element -->
  <div ref="editor.containerRef" class="rounded border p-3 min-h-[80px]" />
</template>
```

**Element Plus example**

```vue
<el-input :ref="editor.containerRef" type="textarea" :rows="3" />
```

**Vuetify example**

```vue
<v-textarea :ref="editor.containerRef" variant="outlined" />
```

---

## Persistence

Mentions are stored as `@{userId}` tokens. Save the serialised string and re-render it later:

```ts
import { serializeToText, serializeToMarkdown } from 'mention-editor';

// Store
const stored = serializeToMarkdown(nodes);
// "Great work @[Alice Johnson](u1), please check with @[Bob Smith](u2)."

// Re-render in React (returns (string | HTMLElement)[])
import { renderCommentMessage } from 'mention-editor/react';
const parts = renderCommentMessage(stored, users);

// Re-render to HTML string (for emails, SSR, etc.)
import { renderCommentMessageToHTML } from 'mention-editor';
const html = renderCommentMessageToHTML(stored, users);
```

---

## Keyboard shortcuts

| Key             | Action                              |
| --------------- | ----------------------------------- |
| `@`             | Open mention dropdown               |
| `↑` / `↓`       | Navigate dropdown                   |
| `Enter` / `Tab` | Select highlighted user             |
| `Escape`        | Close dropdown                      |
| `Enter`         | Submit (calls `onSubmit`)           |
| `Shift+Enter`   | Insert newline                      |
| `Backspace`     | On chip: shrinks name, then removes |

---

## Custom palette

```ts
import { DEFAULT_MENTION_PALETTE } from 'mention-editor';

// Custom palette
createMentionEditor({ ..., palette: ['#e11d48', '#0ea5e9', '#16a34a'] });

// Extend the default
createMentionEditor({ ..., palette: [...DEFAULT_MENTION_PALETTE, '#f59e0b'] });

// Per-user color (takes precedence over palette)
const users = [{ id: 'u1', name: 'Alice', color: '#7c3aed' }];
```

---

## API reference

### Core (`mention-editor`)

| Export                                             | Description                                 |
| -------------------------------------------------- | ------------------------------------------- |
| `createMentionEditor(opts)`                        | Creates a vanilla editor instance           |
| `serializeToText(nodes)`                           | Nodes → plain text string                   |
| `serializeToMarkdown(nodes)`                       | Nodes → `@[name](id)` markdown string       |
| `renderCommentMessage(msg, users, palette?)`       | Stored string → `(string \| HTMLElement)[]` |
| `renderCommentMessageToHTML(msg, users, palette?)` | Stored string → HTML string                 |
| `DEFAULT_MENTION_PALETTE`                          | Built-in color array                        |

### Types

```ts
interface MentionUser {
  id: string;
  name: string;
  avatar?: string; // URL — shown in chip avatar
  meta?: string; // Subtitle shown in dropdown
  color?: string; // CSS color — overrides palette
  [key: string]: unknown;
}

type TextNode = { type: 'text'; text: string };
type MentionNode = { type: 'mention'; user: MentionUser; displayName: string };
type EditorNode = TextNode | MentionNode;

interface MentionEditorInstance {
  getNodes: () => EditorNode[];
  setNodes: (nodes: EditorNode[], emit?: boolean) => void;
  focus: () => void;
  clear: () => void;
  destroy: () => void;
  setPlaceholder: (text: string) => void;
}
```

---

## Examples

Full runnable examples live in [`examples/`](./examples):

| File                                                                     | What it shows                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [`examples/react/basic.tsx`](./examples/react/basic.tsx)                 | Drop-in `<MentionInput>`, submit/clear, serialise output             |
| [`examples/react/with-hook.tsx`](./examples/react/with-hook.tsx)         | `useMentionEditor` hook, custom container, toolbar, load draft       |
| [`examples/react/with-mui.tsx`](./examples/react/with-mui.tsx)           | MUI `<Box>` shell, send button, MUI swap-in comments                 |
| [`examples/vue/basic.vue`](./examples/vue/basic.vue)                     | Drop-in `<MentionInput>`, `@submit`/`@change` emits, scoped styles   |
| [`examples/vue/with-composable.vue`](./examples/vue/with-composable.vue) | `useMentionEditor`, reactive computed users, team filter, load draft |

---

## License

MIT © [Amay Churi](https://github.com/amaychuri)
