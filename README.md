# mention-kit

<p align="center">
  <img src="media/banner.svg" alt="mention-kit — headless mention editor" width="100%" />
</p>

<p align="center">
  <strong>Headless, zero-dependency TypeScript mention editor</strong><br/>
  Built on <code>contentEditable</code> — works with React, Vue 3, or vanilla JS.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cursortag/mention-kit"><img src="https://img.shields.io/npm/v/@cursortag/mention-kit?color=7c3aed&label=npm" alt="npm version" /></a>
  <a href="https://github.com/amchuri/mention-kit/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cursortag/mention-kit?color=059669" alt="license" /></a>
  <a href="https://www.npmjs.com/package/@cursortag/mention-kit"><img src="https://img.shields.io/npm/dt/@cursortag/mention-kit?color=0891b2" alt="downloads" /></a>
  <a href="https://bundlephobia.com/package/@cursortag/mention-kit"><img src="https://img.shields.io/bundlephobia/minzip/@cursortag/mention-kit?color=ec4899&label=gzip" alt="bundle size" /></a>
  <a href="https://amchuri.github.io/mention-kit/"><img src="https://img.shields.io/badge/demo-live-d97706" alt="demo" /></a>
</p>

---

## See it in action

**▶ [Live demo](https://amchuri.github.io/mention-kit/)** — interactive React + Vue examples: multiple triggers, async search, creatable tags, hovercards, themes, and a rendered preview of each submitted comment.

<!--
  DEMO MEDIA (drop-in — recorded GIFs render here once added; nothing breaks until then).
  Record ~8–12s clips against the live demo (e.g. with Kap / LICEcap / QuickTime), 640px wide,
  save under media/, and uncomment the matching line:

  ![Overview](media/demo.gif)
  ![Multiple triggers + creatable tags](media/triggers.gif)
  ![Async / commands](media/async.gif)
  ![Hovercards + themes](media/hovercards.gif)
-->

---

## Features

- **Zero dependencies** — no framework required for the core
- **Dual CJS + ESM** builds with full TypeScript types
- **React** — `<MentionInput />` component and `useMentionEditor()` hook
- **Vue 3** — `<MentionInput />` component and `useMentionEditor()` composable
- **Headless** — renders a plain `<div>`, style with Tailwind / MUI / shadcn / anything
- **Multiple triggers** — `@` people, `#` tags, `/` commands, `:` emoji, each with its own data, colors, and filter; tags render as label pills, people as avatars
- **Async suggestions** — fetch results from a server as you type (debounced, with a loading state)
- **Creatable items** — offer a "Create …" row so users can add a new `#tag` on the fly
- **Slash commands** — a trigger can run an action (insert text, open a dialog) instead of inserting a chip
- **Hover user-info cards** — hover a mention to reveal avatar, meta, and copyable fields
- **Themeable** — `--mk-*` CSS variables (light/dark presets) or a `theme` object; per-user or shared palette
- **Controlled or uncontrolled** — drive it with a `value` prop, or leave it self-managed
- **Accessible** — ARIA combobox semantics (`aria-expanded` / `aria-controls` / `aria-activedescendant`), keyboard-first
- **Persistence format** — `@{userId}` / `#{tagId}` tokens for easy storage and re-render

The core is **~11.5 KB gzipped with zero runtime dependencies** (the React and
Vue entry points are ~13 KB each).

---

## Comparison

Most mention libraries are tied to one framework, or bolted onto a full
rich-text engine (ProseMirror / Lexical). mention-kit is a small, framework-
agnostic primitive built on plain `contentEditable`.

|                           | mention-kit               | react-mentions   | rc-mentions      | @tiptap/extension-mention | lexical-beautiful-mentions |
| ------------------------- | ------------------------- | ---------------- | ---------------- | ------------------------- | -------------------------- |
| Frameworks                | **React · Vue · vanilla** | React            | React            | Tiptap (React/Vue/JS)     | React (Lexical)            |
| Runtime deps              | **none**                  | a few            | Ant Design stack | Tiptap + ProseMirror      | Lexical                    |
| Built on                  | `contentEditable`         | textarea overlay | textarea         | ProseMirror               | Lexical                    |
| Requires an editor engine | **no**                    | no               | no               | yes                       | yes                        |
| Multiple triggers         | ✓                         | ✓                | ✓                | ✓                         | ✓                          |
| Async suggestions         | ✓                         | ✓                | ✓                | ✓                         | ✓                          |
| Creatable items           | ✓                         | —                | —                | plugin                    | ✓                          |
| Hover cards / theming     | ✓                         | —                | —                | BYO                       | —                          |

If you already run Tiptap or Lexical, use their mention extension. If you want a
tiny, standalone `@mention` input that works anywhere, that's this.

---

## Installation

```bash
# npm
npm install @cursortag/mention-kit

# yarn
yarn add @cursortag/mention-kit

# pnpm
pnpm add @cursortag/mention-kit
```

React and Vue are optional peer dependencies — install only what you use:

```bash
# React
yarn add @cursortag/mention-kit react

# Vue
yarn add @cursortag/mention-kit vue
```

---

## Quick start

### React

```tsx
import { MentionInput } from '@cursortag/mention-kit/react';

const users = [
  { id: 'u1', name: 'Alice Johnson', meta: 'Engineering' },
  { id: 'u2', name: 'Bob Smith', meta: 'Design' },
];

function CommentBox() {
  return (
    <MentionInput
      users={users}
      placeholder="Write a comment… (@ to mention)"
      onSubmit={(text) => console.log(text)}
      className="rounded border p-2 min-h-[80px]"
    />
  );
}
```

### Vue 3

```vue
<script setup lang="ts">
import { MentionInput } from '@cursortag/mention-kit/vue';

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
    @submit="(text) => console.log(text)"
  />
</template>
```

### Vanilla JS

```ts
import { createMentionEditor } from '@cursortag/mention-kit';

const editor = createMentionEditor({
  container: document.getElementById('editor')!,
  users: [
    { id: 'u1', name: 'Alice Johnson' },
    { id: 'u2', name: 'Bob Smith' },
  ],
  placeholder: 'Write a comment…',
  onSubmit: (text, { mentionedUsers }) => {
    console.log(text); // "Hey @Alice Johnson, check this"
    console.log(mentionedUsers); // [{ id: 'u1', name: 'Alice Johnson', ... }]
  },
});

// Cleanup
editor.destroy();
```

---

## Callback signature

All callbacks receive `text` as the first argument and an optional `meta` object as the second:

```ts
onChange?: (text: string, meta: EditorCallbackMeta) => void;
onSubmit?: (text: string, meta: EditorCallbackMeta) => void;
```

| Argument              | Type            | Description                                          |
| --------------------- | --------------- | ---------------------------------------------------- |
| `text`                | `string`        | Plain text with mentions as `@displayName`           |
| `meta.nodes`          | `EditorNode[]`  | Full structured document (for storage/serialization) |
| `meta.mentionedUsers` | `MentionUser[]` | De-duplicated list of mentioned users                |

**Simple usage** — just use `text`:

```tsx
onSubmit={(text) => saveComment(text)}
```

**Power-user usage** — destructure `meta` when needed:

```tsx
onSubmit={(text, { nodes, mentionedUsers }) => {
  saveComment(text);
  notifyUsers(mentionedUsers.map(u => u.id));
  storeNodes(nodes); // for re-rendering later
}}
```

---

## React

### `<MentionInput />` — drop-in component

```tsx
import { useRef } from 'react';
import {
  MentionInput,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/react';

function CommentBox() {
  const ref = useRef<MentionEditorInstance>(null);

  return (
    <>
      <MentionInput
        ref={ref}
        users={users}
        placeholder="Write a comment…"
        onSubmit={(text, { mentionedUsers }) => {
          console.log(text, mentionedUsers);
          ref.current?.clear();
        }}
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
| `onSubmit`       | `(text, meta) => void`            | Called on `Enter`                 |
| `onChange`       | `(text, meta) => void`            | Called on every edit              |
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
import { useMentionEditor } from '@cursortag/mention-kit/react';

function MyEditor() {
  const editor = useMentionEditor({
    users,
    onChange: (text) => console.log(text),
    onSubmit: (text) => {
      save(text);
      editor.clear();
    },
  });

  return (
    <div
      ref={editor.containerRef}
      className="rounded border border-gray-300 p-3 min-h-[80px]"
    />
  );
}
```

**MUI example**

```tsx
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
import {
  MentionInput,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/vue';

const editorRef = ref<MentionEditorInstance | null>(null);
</script>

<template>
  <MentionInput
    ref="editorRef"
    :users="users"
    placeholder="Write a comment…"
    class="rounded border border-gray-300 p-3 min-h-[80px] text-sm"
    @submit="
      (text) => {
        save(text);
        editorRef?.clear();
      }
    "
    @change="(text) => console.log(text)"
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

| Event    | Arguments                                  | Description         |
| -------- | ------------------------------------------ | ------------------- |
| `change` | `(text: string, meta: EditorCallbackMeta)` | Fires on every edit |
| `submit` | `(text: string, meta: EditorCallbackMeta)` | Fires on `Enter`    |

**Exposed methods** (via template ref)

Same as the React ref methods — `getNodes`, `setNodes`, `clear`, `focus`, `setPlaceholder`.

---

### `useMentionEditor()` — composable for custom containers

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useMentionEditor } from '@cursortag/mention-kit/vue';

const editor = useMentionEditor({
  get users() {
    return filteredUsers.value;
  },
  onSubmit: (text) => {
    save(text);
    editor.clear();
  },
});
</script>

<template>
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

## Utility functions

These are standalone exports — use them anywhere, no editor instance needed.

### `serializeToText(nodes)`

Converts an `EditorNode[]` to a plain text string. Mentions become `@displayName`.

```ts
import { serializeToText } from '@cursortag/mention-kit';

const text = serializeToText(nodes);
// "Hey @Alice Johnson, check this PR"
```

### `serializeToMarkdown(nodes)`

Converts an `EditorNode[]` to a markdown-style string with user IDs. Best for storage — you can re-render it later.

```ts
import { serializeToMarkdown } from '@cursortag/mention-kit';

const md = serializeToMarkdown(nodes);
// "Hey @[Alice Johnson](u1), check this PR"
```

### `renderCommentMessage(message, users, palette?)`

Takes a stored `@{userId}` message string and returns an array of text strings and `HTMLElement` chips. Use this to display stored messages in a non-editable context.

```ts
import { renderCommentMessage } from '@cursortag/mention-kit';

const stored = 'Great work @{u1}, please check with @{u2}';
const parts = renderCommentMessage(stored, users);
// [ 'Great work ', <span>Alice Johnson</span>, ', please check with ', <span>Bob Smith</span>, '' ]

// Append to DOM
parts.forEach((part) => {
  container.appendChild(
    typeof part === 'string' ? document.createTextNode(part) : part,
  );
});
```

### `renderCommentMessageToHTML(message, users, palette?)`

Same as `renderCommentMessage`, but returns a single HTML string. Great for emails, server-side rendering, or `dangerouslySetInnerHTML`.

```ts
import { renderCommentMessageToHTML } from '@cursortag/mention-kit';

const html = renderCommentMessageToHTML('Hey @{u1}!', users);
// '<span style="...">Alice Johnson</span>'

// In React (use with caution):
<div dangerouslySetInnerHTML={{ __html: html }} />
```

### `DEFAULT_MENTION_PALETTE`

The built-in array of hex colors used when a user has no `color` property. Export it to extend or override.

```ts
import { DEFAULT_MENTION_PALETTE } from '@cursortag/mention-kit';

// Extend with your brand colors
const palette = [...DEFAULT_MENTION_PALETTE, '#f59e0b', '#ec4899'];

createMentionEditor({ ..., palette });
```

---

## Persistence

Mentions are stored as `@{userId}` tokens. Save the serialised string and re-render it later:

```ts
import { serializeToMarkdown, renderCommentMessageToHTML } from '@cursortag/mention-kit';

// 1. User submits a comment — store the markdown
onSubmit={(text, { nodes }) => {
  const stored = serializeToMarkdown(nodes);
  // "Great work @[Alice Johnson](u1), please check with @[Bob Smith](u2)."
  db.save(stored);
}}

// 2. Later, re-render the stored string to HTML
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
import { DEFAULT_MENTION_PALETTE } from '@cursortag/mention-kit';

// Custom palette
createMentionEditor({ ..., palette: ['#e11d48', '#0ea5e9', '#16a34a'] });

// Extend the default
createMentionEditor({ ..., palette: [...DEFAULT_MENTION_PALETTE, '#f59e0b'] });

// Per-user color (takes precedence over palette)
const users = [{ id: 'u1', name: 'Alice', color: '#7c3aed' }];
```

---

## Multiple triggers, async & custom filter

By default the editor uses a single `@` trigger backed by `users`. Pass
`triggers` to handle several — `@` people, `#` tags, `/` commands, `:` emoji —
each with its own data source, colors, and matching. `triggers` fully replaces
the `users` shorthand.

```ts
createMentionEditor({
  container,
  get users() {
    return [];
  }, // ignored when `triggers` is set
  triggers: [
    { trigger: '@', items: people, color: '#7c3aed' },
    { trigger: '#', items: tags, color: '#0891b2', label: 'Add a tag' },
    {
      // Async search — items is a function returning a Promise.
      trigger: '/',
      debounce: 200, // wait 200ms after typing stops
      serverFiltered: true, // results are already filtered server-side
      items: async (query) => {
        const res = await fetch(`/api/commands?q=${query}`);
        return res.json(); // MentionItem[]  ({ id, name, ... })
      },
    },
  ],
});
```

Each trigger accepts:

| Field            | Type                                           | Default             | Description                               |
| ---------------- | ---------------------------------------------- | ------------------- | ----------------------------------------- |
| `trigger`        | `string`                                       | —                   | Single trigger char (`@`, `#`, `/`, `:`)  |
| `items`          | `MentionItem[] \| (query) => Items \| Promise` | —                   | Static list or a (async) search function  |
| `filter`         | `(item, query) => boolean`                     | `name.includes`     | Custom matcher                            |
| `serverFiltered` | `boolean`                                      | `false`             | Skip local filtering (source pre-filters) |
| `debounce`       | `number`                                       | `0`                 | ms to debounce async `items()`            |
| `minChars`       | `number`                                       | `0`                 | Min query length before opening           |
| `allowSpaces`    | `boolean`                                      | `false`             | Allow spaces inside the query             |
| `maxSuggestions` | `number`                                       | top-level           | Max rows shown                            |
| `color`          | `string`                                       | palette             | Default chip color for this trigger       |
| `label`          | `string`                                       | `"Mention someone"` | Dropdown header                           |
| `renderItem`     | `(item, selected) => HTMLElement`              | —                   | Custom row renderer                       |
| `onSelect`       | `(item, ctx) => void`                          | —                   | Slash-command mode (see below)            |
| `allowCreate`    | `boolean`                                      | `false`             | Offer a "Create …" row for new items      |
| `onCreate`       | `(query) => MentionItem`                       | —                   | Build the created item (implies create)   |
| `createLabel`    | `(query) => string`                            | `Create "<q>"`      | Label for the "Create …" row              |

### Create new items (`allowCreate` / `onCreate`)

Set `allowCreate` (or provide `onCreate`) and, when the query matches no existing
item, the dropdown offers a **"Create …"** row. Selecting it inserts a brand-new
mention chip — perfect for letting users add a `#tag` that doesn't exist yet.

```ts
{
  trigger: '#',
  items: tags,
  allowCreate: true,
  // Optional — mint your own id/color (default is { id: query, name: query }):
  onCreate: (query) => ({ id: `tag:${query}`, name: query, color: '#0891b2' }),
}
```

The created item is inserted like any other mention and persists as
`#{tag:query}`. To re-render stored content containing created items, include
them in `triggerItems` (accumulate them from `onCreate`).

### Slash commands (`onSelect`)

Give a trigger an `onSelect` handler and selecting an item **runs the callback
instead of inserting a chip** — the typed trigger text is removed first. Use
`ctx.insertText(text)` to insert content at the caret. Perfect for `/` commands:

```ts
{
  trigger: '/',
  items: [
    { id: 'assign', name: 'assign', meta: 'Assign to a teammate' },
    { id: 'date',   name: 'date',   meta: 'Insert today' },
  ],
  onSelect: (item, ctx) => {
    if (item.id === 'date') ctx.insertText(new Date().toISOString().slice(0, 10));
    else openAssignDialog();          // any side effect
  },
}
```

Mentions remember their trigger, so they persist as `<trigger>{id}` (e.g.
`#{t1}`) and round-trip. When re-rendering stored content that uses non-`@`
triggers, pass `triggerItems` so ids resolve to names:

```ts
// vanilla / Vue
renderCommentMessage(stored, people, palette, [{ trigger: '#', items: tags }]);
parsePersist(stored, people, [{ trigger: '#', items: tags }]);

// React
<RenderedMessage message={stored} users={people} triggerItems={[{ trigger: '#', items: tags }]} />
```

React & Vue `<MentionInput>` accept `triggers` as a prop.

---

## Controlled value

Drive the editor from state with a `value` prop (a persisted `@{id}` string).
Pair it with `onChange` + `serializeToPersist`. The editor only re-seeds when
`value` differs from its current content, so typing keeps its caret.

```tsx
import { MentionInput, serializeToPersist } from '@cursortag/mention-kit/react';

function Controlled() {
  const [value, setValue] = useState('Hi @{u1}');
  return (
    <MentionInput
      users={users}
      value={value}
      onChange={(_text, { nodes }) => setValue(serializeToPersist(nodes))}
    />
  );
}
```

```vue
<!-- Vue -->
<MentionInput
  :users="users"
  :value="value"
  @change="(_t, { nodes }) => (value = serializeToPersist(nodes))"
/>
```

Works on the hook / composable too. Uncontrolled? Use `defaultValue` /
`defaultNodes` instead.

---

## Accessibility

The editor follows the ARIA combobox pattern. The editable exposes
`role="textbox"`, `aria-multiline`, and `aria-autocomplete="list"`, and while the
suggestion list is open it sets `aria-expanded`, `aria-controls` (the listbox
id), and `aria-activedescendant` (the highlighted option id). The dropdown is a
`role="listbox"` with `role="option"` rows. Keyboard: `↑↓` navigate, `Enter` /
`Tab` select, `Escape` closes.

---

## Hover user-info cards

Reveal a rich profile card when a reader hovers a mention in a **rendered
message** — avatar, meta, and any extra fields, each optionally copyable.

Give users the info you want to surface:

```ts
const users = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    meta: 'Staff Engineer',
    avatar: 'https://…/alice.png',
    email: 'alice@acme.com', // shown as a copyable row
    details: [
      { label: 'Team', value: 'Platform' },
      { label: 'Slack', value: '@alice', href: 'https://acme.slack.com/…' },
    ],
  },
];
```

**React** — just add the `hovercard` prop to `<RenderedMessage />`:

```tsx
import { RenderedMessage } from '@cursortag/mention-kit/react';

<RenderedMessage message={stored} users={users} hovercard />

// Configure copy behavior, delays, or a fully custom card body:
<RenderedMessage
  message={stored}
  users={users}
  hovercard={{ copyFields: true, copyUser: (u) => `${u.name} <${u.email}>` }}
/>
```

**Vanilla / Vue** — render the message, then wire cards onto the container. It
returns a cleanup function; call it on unmount.

```ts
import { renderCommentMessage, attachHovercards } from '@cursortag/mention-kit';

renderCommentMessage(stored, users).forEach((part) =>
  container.append(
    typeof part === 'string' ? document.createTextNode(part) : part,
  ),
);

const cleanup = attachHovercards(container, users, {
  openDelay: 180, // ms before the card opens
  closeDelay: 140, // ms before it closes
  copyFields: true, // per-row copy buttons (default true)
  copyUser: true, // "copy user" button (default true)
});

// later: cleanup();
```

`attachHovercards` works on the output of `renderCommentMessageToHTML` too — the
mention spans carry `data-mention-id`, so you can inject the HTML and attach
cards afterwards. Copy buttons use `navigator.clipboard` and no-op where it is
unavailable.

| Option       | Type                          | Default | Description                        |
| ------------ | ----------------------------- | ------- | ---------------------------------- |
| `openDelay`  | `number`                      | `180`   | ms before the card opens on hover  |
| `closeDelay` | `number`                      | `140`   | ms before the card closes on leave |
| `copyFields` | `boolean`                     | `true`  | Copy button on each field row      |
| `copyUser`   | `boolean \| (user) => string` | `true`  | "Copy user" button + its text      |
| `render`     | `(user) => HTMLElement`       | —       | Replace the entire card body       |
| `theme`      | `MentionTheme`                | —       | Theme applied to the card          |
| `className`  | `string`                      | —       | Extra class appended to the card   |

---

## Theming

Chips and hovercards read their styling from `--mk-*` CSS custom properties. The
library's built-in look is the `var()` fallback, so the default appearance is
unchanged and per-user colors still win — you only override what you want.

**Option A — plain CSS.** Set the variables on any ancestor (chips) or on
`.mk-hovercard` (the floating card):

```css
.comments {
  --mk-chip-bg: #eef2ff;
  --mk-chip-text: #4338ca;
  --mk-chip-radius: 6px;
}
.mk-hovercard {
  --mk-card-bg: #0b1220;
  --mk-card-text: #e2e8f0;
  --mk-card-border: #1e293b;
  --mk-accent: #60a5fa;
}
```

**Option B — a `theme` object** (React `<RenderedMessage>` / `<MentionInput>`,
Vue props, or `createMentionEditor`). A `light` / `dark` preset seeds the card;
any explicit key overrides it:

```tsx
<RenderedMessage
  message={stored}
  users={users}
  hovercard
  theme={{ preset: 'dark' }}
/>;

createMentionEditor({
  container,
  users,
  theme: { chipBg: '#eef2ff', chipRadius: 6 },
});
```

| Theme key    | CSS variable       | Applies to           |
| ------------ | ------------------ | -------------------- |
| `preset`     | (seeds card vars)  | `'light'` / `'dark'` |
| `chipBg`     | `--mk-chip-bg`     | chip background      |
| `chipText`   | `--mk-chip-text`   | chip text            |
| `chipRadius` | `--mk-chip-radius` | chip corners         |
| `cardBg`     | `--mk-card-bg`     | card background      |
| `cardText`   | `--mk-card-text`   | card text            |
| `cardMuted`  | `--mk-card-muted`  | labels / meta        |
| `cardBorder` | `--mk-card-border` | card border          |
| `cardShadow` | `--mk-card-shadow` | card shadow          |
| `cardRadius` | `--mk-card-radius` | card corners         |
| `accent`     | `--mk-accent`      | copy buttons / links |

`resolveThemeVars(theme)` returns the raw `{ '--mk-*': value }` map and
`applyTheme(el, theme)` writes it onto an element, if you need to theme a
container yourself.

---

## API reference

### Core (`@cursortag/mention-kit`)

| Export                                                            | Description                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `createMentionEditor(opts)`                                       | Creates a vanilla editor instance                                  |
| `serializeToText(nodes)`                                          | Nodes to plain text string                                         |
| `serializeToMarkdown(nodes)`                                      | Nodes to `@[name](id)` markdown string                             |
| `renderCommentMessage(msg, users, palette?, triggerItems?)`       | Stored string to `(string \| HTMLElement)[]`                       |
| `renderCommentMessageToHTML(msg, users, palette?, triggerItems?)` | Stored string to HTML string                                       |
| `parsePersist(raw, users, triggerItems?)`                         | Stored string to `EditorNode[]`                                    |
| `attachHovercards(root, users, opts?)`                            | Wire hover user-info cards onto rendered mentions; returns cleanup |
| `resolveThemeVars(theme)`                                         | Theme object to `{ '--mk-*': value }` map                          |
| `applyTheme(el, theme)`                                           | Write theme vars onto an element                                   |
| `DEFAULT_MENTION_PALETTE`                                         | Built-in color array                                               |

### Types

```ts
interface MentionUser {
  id: string;
  name: string;
  avatar?: string; // URL — shown in chip avatar
  meta?: string; // Subtitle shown in dropdown + hovercard
  color?: string; // CSS color — overrides palette
  email?: string; // Copyable row in the hovercard
  details?: MentionUserDetail[]; // Extra hovercard rows
  [key: string]: unknown;
}

interface MentionUserDetail {
  label: string;
  value: string;
  copyable?: boolean; // default true
  href?: string; // renders value as a link (http(s)/mailto/tel)
}

type MentionItem = MentionUser; // items a trigger can suggest

interface MentionTrigger {
  trigger: string; // single char: '@', '#', '/', ':'
  items:
    | MentionItem[]
    | ((query: string) => MentionItem[] | Promise<MentionItem[]>);
  filter?: (item: MentionItem, query: string) => boolean;
  serverFiltered?: boolean; // items() already filtered — skip local filter
  debounce?: number; // ms, for async items() (default 0)
  minChars?: number; // default 0
  allowSpaces?: boolean; // default false
  maxSuggestions?: number;
  color?: string;
  label?: string;
  renderItem?: (item: MentionItem, selected: boolean) => HTMLElement;
  onSelect?: (item: MentionItem, ctx: TriggerActionContext) => void; // slash-command mode
  allowCreate?: boolean; // offer a "Create …" row for unmatched queries
  onCreate?: (query: string) => MentionItem; // build the created item
  createLabel?: (query: string) => string; // "Create …" row label
}

interface TriggerActionContext {
  trigger: string; // the trigger char that fired
  insertText: (text: string) => void; // insert text at the caret
}

// Item lists per trigger char, for parsing/rendering stored multi-trigger content
interface TriggerItems {
  trigger: string;
  items: MentionItem[];
}

type TextNode = { type: 'text'; text: string };
type MentionNode = {
  type: 'mention';
  user: MentionUser;
  displayName: string;
  trigger?: string; // absent means '@'
};
type EditorNode = TextNode | MentionNode;

interface EditorCallbackMeta {
  nodes: EditorNode[];
  mentionedUsers: MentionUser[];
}

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

## Recipes

**Slack-style** — mention people with `@`, drop emoji with `:`:

```tsx
<MentionInput
  users={people}
  triggers={[
    { trigger: '@', items: people },
    { trigger: ':', items: emoji, label: 'Emoji' },
  ]}
  onSubmit={(text) => send(text)}
/>
```

**Notion-style slash menu** — a `/` trigger that runs commands instead of
inserting a chip:

```tsx
{
  trigger: '/',
  items: commands,
  onSelect: (cmd, ctx) => {
    if (cmd.id === 'date') ctx.insertText(new Date().toLocaleDateString());
    else runCommand(cmd.id);   // open a dialog, toggle a block, …
  },
}
```

**GitHub-issue-style** — mention people with `@` and create labels on the fly
with `#`:

```tsx
triggers={[
  { trigger: '@', items: collaborators },
  { trigger: '#', items: labels, allowCreate: true },  // "Create #needs-triage"
]}
```

---

## Examples

Full runnable examples live in [`examples/`](./examples):

| File                                                                         | What it shows                                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`examples/react/basic.tsx`](./examples/react/basic.tsx)                     | Drop-in `<MentionInput>`, submit text + mentionedUsers, clear                   |
| [`examples/react/with-hook.tsx`](./examples/react/with-hook.tsx)             | `useMentionEditor` hook, custom container, toolbar, live text + mentioned users |
| [`examples/react/with-mui.tsx`](./examples/react/with-mui.tsx)               | MUI `<Box>` shell, send button                                                  |
| [`examples/react/with-hovercards.tsx`](./examples/react/with-hovercards.tsx) | `<RenderedMessage hovercard>`, copyable fields, light/dark `theme` toggle       |
| [`examples/vue/basic.vue`](./examples/vue/basic.vue)                         | Drop-in `<MentionInput>`, `@submit`/`@change` emits                             |
| [`examples/vue/with-composable.vue`](./examples/vue/with-composable.vue)     | `useMentionEditor`, reactive computed users, team filter                        |
| [`examples/vue/with-hovercards.vue`](./examples/vue/with-hovercards.vue)     | `renderCommentMessage` + `attachHovercards`, theme + cleanup on unmount         |

---

## License

MIT (c) [Amay Churi](https://github.com/amchuri)
