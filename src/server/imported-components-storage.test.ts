import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ImportedComponentsConfig } from '../shared/types.ts';
import {
  defaultImportedComponentsConfig,
  IMPORTED_COMPONENTS_SCHEMA_VERSION,
  importedComponentsPath,
  readImportedComponentsConfig,
  writeImportedComponentsConfig,
} from './imported-components-storage.ts';

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await mkdtemp(join(tmpdir(), 'daston-imported-storage-'));
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe('imported components storage', () => {
  it('resolves the imported components path relative to the invoking CWD', () => {
    expect(importedComponentsPath('/some/where')).toBe('/some/where/.daston/components.json');
  });

  it('returns defaults when the file is missing', async () => {
    expect(await readImportedComponentsConfig(projectRoot)).toEqual(defaultImportedComponentsConfig());
  });

  it('roundtrips a write through a read', async () => {
    const config: ImportedComponentsConfig = {
      version: IMPORTED_COMPONENTS_SCHEMA_VERSION,
      definitions: [
        {
          id: 'imported-def-1',
          label: 'Custom panel',
          sourceKind: 'paste',
          libraryId: null,
          sourceCode: 'export default function CustomPanel() { return <div />; }',
          compiledCode: '(() => {})();',
          compileStatus: 'ready',
          compileError: null,
          createdAt: '2026-04-19T00:00:00.000Z',
          updatedAt: '2026-04-19T00:00:00.000Z',
        },
      ],
    };
    await writeImportedComponentsConfig(projectRoot, config);
    expect(await readImportedComponentsConfig(projectRoot)).toEqual(config);
  });

  it('creates the .daston directory on first write', async () => {
    await writeImportedComponentsConfig(projectRoot, defaultImportedComponentsConfig());
    const raw = await readFile(importedComponentsPath(projectRoot), 'utf8');
    expect(JSON.parse(raw)).toEqual(defaultImportedComponentsConfig());
  });
});
