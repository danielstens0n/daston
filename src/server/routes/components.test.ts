import { describe, expect, it } from 'vitest';
import { COMPONENTS } from '../components-catalog.ts';
import { components } from './components.ts';

// No projectRoot needed — the components catalog is server-side static data.

describe('components routes', () => {
  describe('GET /', () => {
    it('returns the full catalog', async () => {
      const res = await components.request('/');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { components: typeof COMPONENTS };
      expect(body.components).toEqual(COMPONENTS);
    });
  });

  describe('GET /:id', () => {
    it('returns the matching component', async () => {
      const res = await components.request('/button');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        id: 'button',
        label: 'Button',
        description: expect.any(String),
      });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await components.request('/nope');
      expect(res.status).toBe(404);
    });
  });
});
