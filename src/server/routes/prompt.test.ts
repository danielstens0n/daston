import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeThemeConfig } from '../storage.ts';
import { createPromptRoutes } from './prompt.ts';

// Same temp-dir-per-test setup as theme.test.ts: prompt rendering reads the
// on-disk theme, so each test needs its own isolated projectRoot.

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-prompt-'));
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

function app() {
  return createPromptRoutes({ projectRoot });
}

async function post(body: unknown) {
  return app().request('/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('prompt routes', () => {
  describe('POST / { kind: "add-component" }', () => {
    it('renders the component label and current theme into the prompt', async () => {
      await writeThemeConfig(projectRoot, {
        version: 1,
        fonts: { heading: 'Serif', body: 'Mono' },
        colors: { primary: '#abc' },
      });
      const res = await post({ kind: 'add-component', component: 'landing' });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { kind: string; prompt: string };
      expect(body.kind).toBe('add-component');
      // Lowercased label in mid-sentence position (see renderAddComponent).
      expect(body.prompt).toContain('landing page component');
      expect(body.prompt).toContain('Serif');
      expect(body.prompt).toContain('primary: #abc');
    });

    it('rejects unknown component ids', async () => {
      const res = await post({ kind: 'add-component', component: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('rejects requests missing the component field', async () => {
      const res = await post({ kind: 'add-component' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST / { kind: "apply-theme" }', () => {
    it('renders the current theme into the prompt', async () => {
      await writeThemeConfig(projectRoot, {
        version: 1,
        fonts: { heading: 'Inter', body: 'Inter' },
        colors: { brand: '#123' },
      });
      const res = await post({ kind: 'apply-theme' });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { kind: string; prompt: string };
      expect(body.kind).toBe('apply-theme');
      expect(body.prompt).toContain('brand: #123');
    });
  });

  describe('POST / errors', () => {
    it('rejects unknown kinds', async () => {
      const res = await post({ kind: 'do-something' });
      expect(res.status).toBe(400);
    });

    it('rejects malformed JSON bodies', async () => {
      const res = await post('not-json');
      expect(res.status).toBe(400);
    });
  });
});
