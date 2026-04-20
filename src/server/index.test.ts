import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createServer } from './index.ts';

let projectRoot: string;
let webRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-srv-'));
  webRoot = join(projectRoot, 'web');
  await mkdir(webRoot, { recursive: true });
  await writeFile(join(webRoot, 'index.html'), '<!doctype html><title>t</title>', 'utf8');
  await writeFile(join(webRoot, 'app.js'), 'console.log(1)', 'utf8');
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe('createServer', () => {
  it('serves GET /api/theme from the resolved project root', async () => {
    const app = createServer({ projectRoot, webRoot });
    const res = await app.request('/api/theme');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ version: 1 });
  });

  it('serves static files from webRoot', async () => {
    const app = createServer({ projectRoot, webRoot });
    const res = await app.request('/app.js');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('console.log');
  });

  it('falls back to index.html for unknown SPA paths', async () => {
    const app = createServer({ projectRoot, webRoot });
    const res = await app.request('/some/client/route');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<!doctype html>');
  });

  it('does not return SPA HTML for unknown API paths', async () => {
    const app = createServer({ projectRoot, webRoot });
    const res = await app.request('/api/no-such-route');
    expect(res.status).toBe(404);
  });
});
