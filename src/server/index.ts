import { Hono } from 'hono';
import { components } from './routes/components.ts';
import { createPromptRoutes } from './routes/prompt.ts';
import { createThemeRoutes } from './routes/theme.ts';

export interface CreateServerOptions {
  projectRoot: string;
}

export function createServer({ projectRoot }: CreateServerOptions) {
  const app = new Hono();
  app.route('/api/theme', createThemeRoutes({ projectRoot }));
  app.route('/api/components', components);
  app.route('/api/prompt', createPromptRoutes({ projectRoot }));
  // TODO: serve dist/web/ in production
  return app;
}
