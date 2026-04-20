import { existsSync } from 'node:fs';
import { defaultThemeConfig, projectConfigPath, writeThemeConfig } from '../../server/storage.ts';
import { reportResolveFailure, resolveProject } from '../resolve-project.ts';

export interface InitOptions {
  project?: string | undefined;
}

export async function init(opts: InitOptions): Promise<void> {
  const resolved = await resolveProject({ cwd: process.cwd(), explicitProject: opts.project });
  if (!resolved.ok) {
    reportResolveFailure(resolved);
    process.exitCode = 1;
    return;
  }
  const configPath = projectConfigPath(resolved.projectRoot);
  if (existsSync(configPath)) {
    process.stdout.write(`daston already initialized at ${configPath}\n`);
    return;
  }
  await writeThemeConfig(resolved.projectRoot, defaultThemeConfig());
  process.stdout.write(`Initialized daston at ${configPath}\n`);
}
