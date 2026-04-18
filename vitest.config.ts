import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Separate from vite.config.ts because the Vite config sets `root` to src/web
// for the SPA build. Tests live across src/server, src/cli, and src/shared,
// so the test runner needs the project root and a broader `include`.

export default defineConfig({
  test: {
    root: resolve(__dirname, '.'),
    include: ['src/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.tsx'],
  },
});
