import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'src/web'),
  plugins: [
    TanStackRouterVite({
      routesDirectory: resolve(__dirname, 'src/web/routes'),
      generatedRouteTree: resolve(__dirname, 'src/web/routeTree.gen.ts'),
    }),
    react(),
  ],
  build: {
    outDir: resolve(__dirname, 'dist/web'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5173',
    },
  },
});
