# Contributing

Thanks for considering a contribution to **@cursortag/mention-kit**! Here's how to get started.

## Development setup

```bash
# Clone the repo
git clone https://github.com/amchuri/mention-kit.git
cd mention-kit

# Install dependencies
yarn install

# Build
yarn build

# Type check
yarn typecheck

# Run tests
yarn test

# Format code
yarn format
```

## Project structure

```
src/
  index.ts              # Public API barrel (vanilla JS)
  mention-editor.ts # Core editor logic (headless, zero-dep)
  react.tsx             # React bindings (component + hook)
  vue.ts                # Vue 3 bindings (component + composable)
  _build-opts.ts        # Shared helper for framework bindings
  mention-editor.test.ts

examples/               # Usage examples (React + Vue)
demo/                   # GitHub Pages demo site (Vite app)
```

## Making changes

1. **Fork** the repo and create a branch from `main`.
2. **Write code** — the pre-commit hook runs Prettier automatically via lint-staged.
3. **Type check** — run `yarn typecheck` to make sure there are no errors.
4. **Test** — run `yarn test` and add tests for new behaviour where possible.
5. **Build** — run `yarn build` to make sure the output is correct.
6. **Commit** — write a clear commit message describing what changed and why.
7. **Open a PR** against `main`.

## Guidelines

- Keep the core zero-dependency — no runtime packages in `src/mention-editor.ts`.
- React and Vue are **optional** peer dependencies. Never import them from the core.
- Don't add CSS frameworks or external styling — the library is headless by design.
- Run `yarn format` before committing (or let the pre-commit hook handle it).
- Match the existing code style: no trailing summaries, no emoji in code, minimal comments.

## Running the demo site locally

```bash
cd demo
yarn install
yarn dev
```

Open `http://localhost:5173/mention-kit/` in your browser.

## Reporting bugs

Open an issue at [github.com/amchuri/mention-kit/issues](https://github.com/amchuri/mention-kit/issues) with:

- What you expected vs. what happened
- Steps to reproduce
- Browser and OS

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
