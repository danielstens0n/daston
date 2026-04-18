import { Hono } from 'hono';
import { COMPONENTS, getComponent } from '../components-catalog.ts';

// Read-only catalog of stock components the canvas can render.
// No per-project state today — if user-editable overrides land here later,
// convert to a `createComponentsRoutes({ projectRoot })` factory like the
// theme and prompt routes.

export const components = new Hono();

components.get('/', (c) => c.json({ components: COMPONENTS }));

components.get('/:id', (c) => {
  const component = getComponent(c.req.param('id'));
  if (!component) return c.json({ error: 'unknown component' }, 404);
  return c.json(component);
});
