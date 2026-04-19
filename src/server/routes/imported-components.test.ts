import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  IMPORTED_COMPONENTS_SCHEMA_VERSION,
  readImportedComponentsConfig,
  writeImportedComponentsConfig,
} from '../imported-components-storage.ts';
import { createImportedComponentsRoutes } from './imported-components.ts';

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-imported-routes-'));
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

function app() {
  return createImportedComponentsRoutes({ projectRoot });
}

async function send(method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return app().request(path, init);
}

describe('imported components routes', () => {
  describe('GET /library', () => {
    it('returns the curated import manifest', async () => {
      const res = await app().request('/library');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { components: Array<{ id: string; label: string }> };
      expect(body.components.length).toBeGreaterThan(0);
      expect(body.components[0]).toMatchObject({ id: expect.any(String), label: expect.any(String) });
    });
  });

  describe('POST /', () => {
    it('creates and persists a pasted imported component', async () => {
      const res = await send('POST', '/', {
        sourceKind: 'paste',
        label: 'Custom component',
        sourceCode: 'export default function CustomComponent() { return <div>Hello</div>; }',
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { id: string; compileStatus: string; compiledCode: string };
      expect(body.id).toBe('imported-def-1');
      expect(body.compileStatus).toBe('ready');
      expect(body.compiledCode).toContain('Hello');

      const stored = await readImportedComponentsConfig(projectRoot);
      expect(stored.definitions).toHaveLength(1);
      expect(stored.definitions[0]?.label).toBe('Custom component');
    });

    it('creates a library import from the curated manifest', async () => {
      const res = await send('POST', '/', {
        sourceKind: 'library',
        libraryId: 'stats-card',
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { sourceKind: string; libraryId: string | null; label: string };
      expect(body.sourceKind).toBe('library');
      expect(body.libraryId).toBe('stats-card');
      expect(body.label).toContain('Stats');
    });

    it('rejects pasted components with unsupported imports', async () => {
      const res = await send('POST', '/', {
        sourceKind: 'paste',
        label: 'Bad import',
        sourceCode:
          "import Button from './Button'; export default function BadImport() { return <Button />; }",
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: expect.stringContaining('Unsupported import'),
      });
    });
  });

  describe('GET /:id/preview', () => {
    it('returns an embeddable preview page for a saved definition', async () => {
      await send('POST', '/', {
        sourceKind: 'paste',
        label: 'Preview card',
        sourceCode: 'export default function PreviewCard() { return <div>Preview body</div>; }',
      });
      const res = await app().request('/imported-def-1/preview');
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain('<div id="root"></div>');
      expect(body).toContain('Preview body');
    });
  });

  describe('POST /:id/revalidate', () => {
    it('recompiles an existing definition', async () => {
      await send('POST', '/', {
        sourceKind: 'paste',
        label: 'Custom component',
        sourceCode: 'export default function CustomComponent() { return <div>First</div>; }',
      });
      await send('PUT', '/imported-def-1', {
        sourceCode: 'export default function CustomComponent() { return <div>Second</div>; }',
      });
      const res = await send('POST', '/imported-def-1/revalidate');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { compiledCode: string };
      expect(body.compiledCode).toContain('Second');
    });

    it('returns the updated error state when recompilation fails', async () => {
      await writeImportedComponentsConfig(projectRoot, {
        version: IMPORTED_COMPONENTS_SCHEMA_VERSION,
        definitions: [
          {
            id: 'imported-def-1',
            label: 'Broken component',
            sourceKind: 'paste',
            libraryId: null,
            sourceCode:
              "import Button from './Button'; export default function BrokenComponent() { return <Button />; }",
            compiledCode: '(() => {})();',
            compileStatus: 'ready',
            compileError: null,
            createdAt: '2026-04-19T00:00:00.000Z',
            updatedAt: '2026-04-19T00:00:00.000Z',
          },
        ],
      });

      const res = await send('POST', '/imported-def-1/revalidate');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { compileStatus: string; compileError: string | null };
      expect(body.compileStatus).toBe('error');
      expect(body.compileError).toContain('Unsupported import');

      const stored = await readImportedComponentsConfig(projectRoot);
      expect(stored.definitions[0]).toMatchObject({
        compileStatus: 'error',
        compileError: expect.stringContaining('Unsupported import'),
      });
    });
  });

  describe('DELETE /:id', () => {
    it('removes a definition from project storage', async () => {
      await send('POST', '/', {
        sourceKind: 'paste',
        label: 'Delete me',
        sourceCode: 'export default function DeleteMe() { return <div />; }',
      });
      const res = await send('DELETE', '/imported-def-1');
      expect(res.status).toBe(204);
      expect((await readImportedComponentsConfig(projectRoot)).definitions).toEqual([]);
    });
  });
});
