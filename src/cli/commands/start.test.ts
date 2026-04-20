import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { start } from './start.ts';

describe('start', () => {
  let appRoot: string;
  const roots: string[] = [];

  beforeEach(async () => {
    process.exitCode = undefined;
    appRoot = await mkdtemp(join(tmpdir(), 'daston-start-'));
    roots.push(appRoot);
    await writeFile(
      join(appRoot, 'package.json'),
      `${JSON.stringify({ dependencies: { react: '^19.0.0' } })}\n`,
      'utf8',
    );
  });

  afterEach(async () => {
    for (const r of roots.splice(0)) {
      await rm(r, { recursive: true, force: true });
    }
  });

  it('sets exit code when the web bundle is missing', async () => {
    const emptyWeb = await mkdtemp(join(tmpdir(), 'daston-start-web-'));
    roots.push(emptyWeb);
    await start({ project: appRoot, webRoot: emptyWeb });
    expect(process.exitCode).toBe(1);
  });
});
