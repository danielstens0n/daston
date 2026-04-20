import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { components } from './routes/components.ts';
import { createImportedComponentsRoutes } from './routes/imported-components.ts';
import { createPromptRoutes } from './routes/prompt.ts';
import { createThemeRoutes } from './routes/theme.ts';

export interface CreateServerOptions {
  projectRoot: string;
  /** Absolute path to the Vite build output directory (contains `index.html`). */
  webRoot: string;
}

export function createServer({ projectRoot, webRoot }: CreateServerOptions) {
  const indexHtml = readFileSync(join(webRoot, 'index.html'), 'utf8');
  const app = new Hono();
  app.route('/api/theme', createThemeRoutes({ projectRoot }));
  app.route('/api/components', components);
  app.route('/api/imported-components', createImportedComponentsRoutes({ projectRoot }));
  app.route('/api/prompt', createPromptRoutes({ projectRoot }));

  app.use('*', serveStatic({ root: webRoot }));
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api')) return c.notFound();
    return c.html(indexHtml);
  });

  return app;
}
