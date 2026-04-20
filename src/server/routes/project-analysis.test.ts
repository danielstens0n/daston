import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProjectAnalysisRoutes } from './project-analysis.ts';

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-pa-api-'));
  await writeFile(
    join(projectRoot, 'package.json'),
    JSON.stringify({ dependencies: { react: '^19.0.0' } }),
    'utf8',
  );
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe('project-analysis routes', () => {
  it('GET / returns structured analysis', async () => {
    const app = createProjectAnalysisRoutes({ projectRoot });
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { projectRoot: string; framework: { kind: string } };
    expect(body.projectRoot).toBe(projectRoot);
    expect(body.framework.kind).toBe('react');
  });
});
