# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.2]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.2
[0.1.1]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.1
[0.1.0]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.0
