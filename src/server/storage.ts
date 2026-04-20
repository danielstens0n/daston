import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { runProjectAnalysis } from '../project-analysis/run.ts';
import { themeSeedToThemeConfig } from '../project-analysis/theme-from-seed.ts';
import type { ThemeConfig } from '../shared/types.ts';

const SCHEMA_VERSION = 1;

export function projectConfigPath(cwd: string = process.cwd()): string {
  return resolve(cwd, '.daston/config.json');
}

export function globalConfigDir(): string {
  return resolve(homedir(), '.daston');
}

export function defaultThemeConfig(): ThemeConfig {
  return {
    version: SCHEMA_VERSION,
    fonts: { heading: 'Inter', body: 'Inter' },
    colors: {},
  };
}

export async function readThemeConfig(cwd: string = process.cwd()): Promise<ThemeConfig> {
  const path = projectConfigPath(cwd);
  if (!existsSync(path)) {
    const analysis = await runProjectAnalysis(cwd);
    return themeSeedToThemeConfig(analysis.themeSeed);
  }
  const raw = await readFile(path, 'utf8');
  const parsed = JSON.parse(raw) as ThemeConfig;
  // TODO: when SCHEMA_VERSION > 1, branch on parsed.version and migrate.
  return parsed;
}

export async function writeThemeConfig(cwd: string, config: ThemeConfig): Promise<void> {
  const path = projectConfigPath(cwd);
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  await rename(tmp, path);
}

export { SCHEMA_VERSION };
