import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { ImportedComponentsConfig } from '../shared/types.ts';

const SCHEMA_VERSION = 1;

export function importedComponentsPath(cwd: string = process.cwd()): string {
  return resolve(cwd, '.daston/components.json');
}

export function defaultImportedComponentsConfig(): ImportedComponentsConfig {
  return {
    version: SCHEMA_VERSION,
    definitions: [],
  };
}

export async function readImportedComponentsConfig(
  cwd: string = process.cwd(),
): Promise<ImportedComponentsConfig> {
  const path = importedComponentsPath(cwd);
  const raw = await readFile(path, 'utf8').then(
    (value) => value,
    (error: unknown) => {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code?: string }).code
          : null;
      if (code === 'ENOENT') return null;
      throw error;
    },
  );
  if (raw === null) return defaultImportedComponentsConfig();
  const parsed = JSON.parse(raw) as ImportedComponentsConfig;
  return parsed;
}

export async function writeImportedComponentsConfig(
  cwd: string,
  config: ImportedComponentsConfig,
): Promise<void> {
  const path = importedComponentsPath(cwd);
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  await rename(tmp, path);
}

export { SCHEMA_VERSION as IMPORTED_COMPONENTS_SCHEMA_VERSION };
