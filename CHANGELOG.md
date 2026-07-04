# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-07-04

### Added

- **Slash-command actions** — a trigger can set `onSelect(item, ctx)` to run a callback instead of inserting a chip. The typed trigger text is removed first; `ctx.insertText(text)` inserts content at the caret. Great for `/` commands (assign, due date, insert snippet). New `TriggerActionContext` type.
- **Controlled `value`** — React/Vue `<MentionInput>` and the hook/composable accept a `value` prop (persisted `@{id}` string). The editor re-seeds only when `value` changes to something other than its current content (pair with `onChange` + `serializeToPersist`), so typing keeps its caret.
- **Combobox accessibility** — the editable now exposes `aria-autocomplete="list"` and toggles `aria-expanded`, `aria-controls`, and `aria-activedescendant` as the suggestion list opens / navigates / closes; the listbox and each option carry stable ids.
- 6 new tests (159 total), including React-render coverage for controlled `value`.

## [0.3.0] - 2026-07-04

### Added

- **Multiple / custom triggers** — new `triggers` option (`MentionTrigger[]`) lets one editor handle `@` users, `#` tags, `/` commands, `:` emoji, etc. Each trigger has its own `items`, `filter`, `color`, `label`, `renderItem`, `minChars`, and `allowSpaces`. Backward compatible: `users` + `renderUser` are synthesized into the default `@` trigger, so existing setups are unchanged.
- **Async suggestions** — a trigger's `items` may be `(query) => Promise<MentionItem[]>`. Resolution is debounced (`debounce`, opt-in), shows a loading row, and guards against stale/out-of-order responses. Set `serverFiltered: true` when the source already filtered.
- **Custom filter** — per-trigger `filter(item, query)` replaces the built-in case-insensitive `name.includes` matcher.
- **`MentionNode.trigger`** — mentions now record which trigger produced them (absent = `@`). `serializeToText` / `serializeToMarkdown` / `serializeToPersist` emit `<trigger>…` accordingly (e.g. `#{t1}`).
- **`triggerItems` param** on `parsePersist`, `renderCommentMessage`, and `renderCommentMessageToHTML` (optional, trailing) resolves non-`@` tokens back to items. React `<RenderedMessage>` gains a matching `triggerItems` prop. Rendered spans carry `data-mention-trigger` for non-`@` triggers.
- New public types: `MentionTrigger`, `MentionItem`, `TriggerItems`. New examples and demo section.
- 11 new tests (153 total).

## [0.2.1] - 2026-07-04

### Docs

- **New examples** for the v0.2.0 hovercard + theming features: [`examples/react/with-hovercards.tsx`](examples/react/with-hovercards.tsx) (`<RenderedMessage hovercard>`, copyable fields, light/dark `theme` toggle) and [`examples/vue/with-hovercards.vue`](examples/vue/with-hovercards.vue) (`renderCommentMessage` + `attachHovercards` with cleanup on unmount and theme change).
- README examples table updated to list the new files.

### Chore

- **`release` / `release:dry` scripts** — `npm run release` (or `yarn release`) publishes to npm; both pin `--registry https://registry.npmjs.org` so they work through yarn too. `prepublishOnly` now also runs the test suite.

## [0.2.0] - 2026-07-04

### Added

- **Hover user-info cards** — `attachHovercards(root, users, opts?)` wires a floating profile card onto every rendered mention (`renderCommentMessage` / `renderCommentMessageToHTML` output). The card shows a large avatar, name, `meta`, the new `email` row, and any `details[]` rows. Returns a cleanup function.
- **Copy actions** — each info row gets a click-to-copy button (`copyFields`, default on) and the card has a "copy user" button that copies a formatted summary (`copyUser`, default on; pass a function for custom text). Uses `navigator.clipboard` and no-ops where unavailable.
- **`<RenderedMessage hovercard theme={…} />`** (React) — add the `hovercard` prop (`boolean | HovercardOptions`) to enable cards, and `theme` to restyle chips + card. Cards attach/clean up automatically with the component lifecycle.
- **Custom themes** — chip and card styles now read from `--mk-*` CSS variables with the built-in look as the `var()` fallback (default appearance unchanged). Override via plain CSS, or pass a `theme` object (with `light` / `dark` presets) to `createMentionEditor`, React/Vue `MentionInput`, or `RenderedMessage`. New helpers `resolveThemeVars(theme)` and `applyTheme(el, theme)`.
- **`MentionUser.email` / `MentionUser.details[]`** and the `MentionUserDetail` type for richer hovercard content.
- Rendered mention spans (both DOM and HTML output) now carry `data-mention-id` and a `mk-chip` class so hovercards and custom styling can target them.
- 23 new tests (142 total).

## [0.1.2] - 2026-04-21

### Added

- **`serializeToPersist(nodes)`** / **`parsePersist(text, users)`** — first-class `@{userId}` persistence format that round-trips with `renderCommentMessage`/`renderCommentMessageToHTML`. Eliminates the need for custom `nodesToString`/`stringToNodes` helpers.
- **`defaultValue`** prop (React + Vue) — pass a persisted `@{userId}` string directly instead of pre-parsing to `EditorNode[]`. The library handles parsing internally.
- **`setDisabled(value)`** — new instance method. Reactively toggles `contentEditable` after mount. React and Vue bindings now watch the `disabled` prop and call this automatically — no more DOM querySelector hacks.
- **`onFocus` / `onBlur`** callbacks on `MentionEditorOptions`. Wired as props on React `MentionInput` / hook, and as `@focus` / `@blur` emits on Vue `MentionInput`.
- **`meta.mentionedUserIds`** — `string[]` of de-duplicated user IDs in every callback, saves a `.map(u => u.id)`.
- **`el`** — new readonly property on `MentionEditorInstance` exposing the underlying `contentEditable` DOM element for measuring/querying without re-typing.
- **`<RenderedMessage />`** React component — renders a stored `@{userId}` message with styled mention chips. Replaces `dangerouslySetInnerHTML` with a typed, XSS-safe component.
- 21 new tests (119 total).

## [0.1.1] - 2026-04-21

### Changed

- **Breaking:** `onChange` and `onSubmit` callback signature changed from `(data: EditorCallbackData) => void` to `(text: string, meta: EditorCallbackMeta) => void`. Text is now the primary first argument; `nodes` and `mentionedUsers` are in the second `meta` argument for power users.
- Renamed `EditorCallbackData` to `EditorCallbackMeta` (no longer contains `text`).
- Vue emits updated: `@change="(text, meta) => ..."` and `@submit="(text, meta) => ..."`.

## [0.1.0] - 2026-04-20

### Added

- Headless mention editor core built on `contentEditable`
- `createMentionEditor()` — vanilla JS factory
- `serializeToText()` / `serializeToMarkdown()` — serialisation helpers
- `renderCommentMessage()` / `renderCommentMessageToHTML()` — re-render stored mentions
- `DEFAULT_MENTION_PALETTE` — customisable color palette
- **React bindings** (`@cursortag/mention-kit/react`)
  - `<MentionInput />` drop-in component
  - `useMentionEditor()` hook for custom containers (MUI, shadcn, etc.)
- **Vue 3 bindings** (`@cursortag/mention-kit/vue`)
  - `<MentionInput />` drop-in component with `@change` / `@submit` emits
  - `useMentionEditor()` composable with reactive getter support
- Keyboard navigation: `@` to open, `↑↓` to navigate, `Enter`/`Tab` to select, `Escape` to close
- Chip backspace: shrinks display name word-by-word, then removes
- Selection deletion: correctly handles expanded selections spanning chips
- Custom palette support via `palette` option
- Per-user color override via `MentionUser.color`
- Custom dropdown renderer via `renderUser` option
- Dual CJS + ESM builds with full `.d.ts` types
- GitHub Pages demo site with live interactive examples

[0.4.0]: https://github.com/amchuri/mention-kit/releases/tag/v0.4.0
[0.3.0]: https://github.com/amchuri/mention-kit/releases/tag/v0.3.0
[0.2.1]: https://github.com/amchuri/mention-kit/releases/tag/v0.2.1
[0.2.0]: https://github.com/amchuri/mention-kit/releases/tag/v0.2.0
[0.1.2]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.2
[0.1.1]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.1
[0.1.0]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.0
