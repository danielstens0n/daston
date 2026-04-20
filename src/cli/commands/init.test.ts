import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { init } from './init.ts';

describe('init', () => {
  let appRoot: string;
  const roots: string[] = [];

  beforeEach(async () => {
    appRoot = await mkdtemp(join(tmpdir(), 'daston-init-'));
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

  it('writes .daston/config.json when missing', async () => {
    await init({ project: appRoot });
    const raw = await readFile(join(appRoot, '.daston', 'config.json'), 'utf8');
    expect(JSON.parse(raw)).toMatchObject({ version: 1 });
  });

  it('does not overwrite an existing config', async () => {
    await init({ project: appRoot });
    const first = await readFile(join(appRoot, '.daston', 'config.json'), 'utf8');
    await init({ project: appRoot });
    const second = await readFile(join(appRoot, '.daston', 'config.json'), 'utf8');
    expect(second).toBe(first);
  });
});
