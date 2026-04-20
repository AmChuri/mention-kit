import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    // Order matters: Vue first so its JSX transform doesn't conflict with React's
    vue(),
    react(),
  ],
  resolve: {
    alias: {
      '@cursortag/mention-kit/react': resolve(__dirname, '../src/react.tsx'),
      '@cursortag/mention-kit/vue': resolve(__dirname, '../src/vue.ts'),
      '@cursortag/mention-kit': resolve(__dirname, '../src/index.ts'),
    },
  },
  // Set the base to the repo name for GitHub Pages subpath hosting
  base: '/mention-kit/',
});
