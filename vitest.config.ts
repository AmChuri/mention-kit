import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/mention-editor.ts'],
      exclude: [
        'src/_build-opts.ts',
        'src/index.ts',
        'src/react.tsx',
        'src/vue.ts',
      ],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
