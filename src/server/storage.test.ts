import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ThemeConfig } from '../shared/types.ts';
import {
  defaultThemeConfig,
  projectConfigPath,
  readThemeConfig,
  SCHEMA_VERSION,
  writeThemeConfig,
} from './storage.ts';

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-storage-'));
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe('storage', () => {
  it('resolves project config path relative to the invoking CWD', () => {
    expect(projectConfigPath('/some/where')).toBe('/some/where/.daston/config.json');
  });

  it('returns defaults when the config file is missing', async () => {
    expect(await readThemeConfig(projectRoot)).toEqual(defaultThemeConfig());
  });

  it('roundtrips a write through a read', async () => {
    const next: ThemeConfig = {
      version: SCHEMA_VERSION,
      fonts: { heading: 'A', body: 'B' },
      colors: { c1: '#000' },
    };
    await writeThemeConfig(projectRoot, next);
    expect(await readThemeConfig(projectRoot)).toEqual(next);
  });

  it('creates the .daston directory on first write', async () => {
    await writeThemeConfig(projectRoot, defaultThemeConfig());
    const raw = await readFile(projectConfigPath(projectRoot), 'utf8');
    expect(JSON.parse(raw)).toEqual(defaultThemeConfig());
  });

  it.todo('migrates older schema versions on read');
});
