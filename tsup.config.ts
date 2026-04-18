import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'bin/daston': 'bin/daston.ts',
    'server/index': 'src/server/index.ts',
  },
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  dts: false,
  banner: { js: '#!/usr/bin/env node' },
});
