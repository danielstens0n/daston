import { existsSync } from 'node:fs';
import { runProjectAnalysis } from '../project-analysis/run.ts';
import { themeSeedToThemeConfig } from '../project-analysis/theme-from-seed.ts';
import { projectConfigPath, readThemeConfig } from '../server/storage.ts';
import type { ProjectAnalysis, ThemeConfig } from '../shared/types.ts';
import { writeJson } from './output.ts';
import {
  type ResolveProjectFailure,
  type ResolveProjectSuccess,
  reportResolveFailure,
  resolveProject,
} from './resolve-project.ts';

export interface LoadedProjectContext {
  projectRoot: string;
  resolution: ResolveProjectSuccess['resolution'];
  analysis: ProjectAnalysis;
  theme: ThemeConfig;
  config: {
    path: string;
    exists: boolean;
  };
}

export type LoadProjectContextResult = { ok: true; context: LoadedProjectContext } | ResolveProjectFailure;

export interface CommandProjectContextOptions {
  project?: string | undefined;
  json?: boolean | undefined;
}

export async function loadProjectContext(options: {
  cwd: string;
  explicitProject?: string | undefined;
}): Promise<LoadProjectContextResult> {
  const resolved = await resolveProject(options);
  if (!resolved.ok) return resolved;

  const analysis = await runProjectAnalysis(resolved.projectRoot);
  const configPath = projectConfigPath(resolved.projectRoot);
  const configExists = existsSync(configPath);
  const theme = configExists
    ? await readThemeConfig(resolved.projectRoot)
    : themeSeedToThemeConfig(analysis.themeSeed);

  return {
    ok: true,
    context: {
      projectRoot: resolved.projectRoot,
      resolution: resolved.resolution,
      analysis,
      theme,
      config: {
        path: configPath,
        exists: configExists,
      },
    },
  };
}

export async function loadProjectContextOrReport(
  options: CommandProjectContextOptions,
): Promise<LoadedProjectContext | null> {
  const loaded = await loadProjectContext({ cwd: process.cwd(), explicitProject: options.project });
  if (loaded.ok) return loaded.context;

  if (options.json) {
    writeJson(loaded);
  } else {
    reportResolveFailure(loaded);
  }
  process.exitCode = 1;
  return null;
}
