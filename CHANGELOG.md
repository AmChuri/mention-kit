# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/amchuri/mention-kit/releases/tag/v0.1.0
