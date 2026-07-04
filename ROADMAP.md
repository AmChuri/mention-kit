# Roadmap

Where `@cursortag/mention-kit` is headed. Not a promise — a prioritized backlog.
Ideas and PRs welcome (see [CONTRIBUTING.md](./CONTRIBUTING.md)).

## Shipped (through 0.5.0)

- Headless core on `contentEditable` — React, Vue 3, and vanilla, zero runtime deps
- Multiple / custom triggers (`@` `#` `/` `:`), per-trigger data, colors, filter
- Async suggestions (debounced, loading state, stale-response guard)
- Creatable items ("Create …" row) and slash-command actions (`onSelect`)
- Label-style chips for non-`@` triggers (tags read as tags, not people)
- Hover user-info cards + copy actions
- Theming via `--mk-*` CSS variables (light/dark presets) or a `theme` object
- Controlled / uncontrolled `value`; ARIA combobox a11y
- `@{id}` / `#{id}` persistence that round-trips to chips or safe HTML

## Now — harden (protect what's shipped)

- [ ] **CI**: GitHub Actions running `typecheck` + `test` + `build` + `format:check` on PRs and `main`
- [ ] **ESLint**: install + flat config (the `lint` script currently references an uninstalled eslint), or remove it
- [ ] **Vue binding tests** (controlled value, triggers) — only React has render coverage today
- [ ] Broaden coverage to `hovercard.ts` / `theme.ts` / triggers; add a **size-limit** budget + badge
- [ ] Clear the remaining GitHub Dependabot alerts (dev-only, but should read clean)

## Next — features (from the competitive gap analysis)

- [ ] **Paste handling** — paste a stored `@{id}` string or text-with-mentions → chips; strip pasted HTML to text _(0.6.0)_
- [ ] **IME / mobile** — composition events (CJK) + touch / virtual-keyboard robustness
- [ ] **Grouped suggestions** — section headers in the dropdown ("Recent", "Everyone")
- [ ] **Constraints** — `maxMentions`, max length; **RTL** text support
- [ ] **Trigger without a menu** (insert on space after `@word`) and **edit-a-mention** (click to replace)

## Later — reach / ecosystem

- [ ] Vue **`v-model`** (`modelValue` + `update:modelValue`) over the controlled `value`
- [ ] **Svelte 5** binding (and/or Solid, Angular)
- [ ] SSR / Next.js guidance + a Nuxt module
- [ ] **Changesets** for release management

## Docs / marketing

- [ ] Demo **GIFs** (placeholders wired in the README)
- [ ] Comparison table + gzipped-size badge
- [ ] Recipes: Slack-style, Notion slash-menu, GitHub-issue-style
- [ ] Migration guide from `react-mentions`
