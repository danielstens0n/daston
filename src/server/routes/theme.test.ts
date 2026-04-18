import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defaultThemeConfig, readThemeConfig } from '../storage.ts';
import { createThemeRoutes } from './theme.ts';

// Tests build a fresh Hono app per request against an isolated temp directory
// so writes don't leak between cases or pollute the developer's home.

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-theme-'));
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

function app() {
  return createThemeRoutes({ projectRoot });
}

async function send(method: string, body: unknown) {
  return app().request('/', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('theme routes', () => {
  describe('GET /', () => {
    it('returns defaults when no config exists', async () => {
      const res = await app().request('/');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(defaultThemeConfig());
    });

    it('returns the saved config after a write', async () => {
      const next = { version: 1, fonts: { heading: 'Serif', body: 'Mono' }, colors: { primary: '#fff' } };
      await send('PUT', next);
      const res = await app().request('/');
      expect(await res.json()).toEqual(next);
    });
  });

  describe('PUT /', () => {
    it('replaces and persists the theme', async () => {
      const next = { version: 1, fonts: { heading: 'A', body: 'B' }, colors: { c1: '#000' } };
      const res = await send('PUT', next);
      expect(res.status).toBe(200);
      expect(await readThemeConfig(projectRoot)).toEqual(next);
    });

    it('rejects bodies missing fonts', async () => {
      const res = await send('PUT', { colors: {} });
      expect(res.status).toBe(400);
    });

    it('rejects non-string color values', async () => {
      const res = await send('PUT', { fonts: { heading: 'a', body: 'b' }, colors: { primary: 123 } });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /', () => {
    it('merges font fields per-key', async () => {
      await send('PUT', { version: 1, fonts: { heading: 'A', body: 'B' }, colors: {} });
      const res = await send('PATCH', { fonts: { body: 'C' } });
      expect(res.status).toBe(200);
      expect((await readThemeConfig(projectRoot)).fonts).toEqual({ heading: 'A', body: 'C' });
    });

    it('merges colors additively without dropping existing keys', async () => {
      await send('PUT', { version: 1, fonts: { heading: 'A', body: 'B' }, colors: { primary: '#111' } });
      await send('PATCH', { colors: { secondary: '#222' } });
      expect((await readThemeConfig(projectRoot)).colors).toEqual({ primary: '#111', secondary: '#222' });
    });

    it('rejects malformed patches', async () => {
      const res = await send('PATCH', { fonts: 'not-an-object' });
      expect(res.status).toBe(400);
    });
  });
});
