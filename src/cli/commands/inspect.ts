import { formatTheme } from '../../server/prompt.ts';
import { writeJson } from '../output.ts';
import { loadProjectContextOrReport } from '../project-context.ts';
import type { ProjectResolution } from '../resolve-project.ts';

export interface InspectOptions {
  project?: string | undefined;
  json?: boolean | undefined;
}

export async function inspect(opts: InspectOptions): Promise<void> {
  const context = await loadProjectContextOrReport(opts);
  if (!context) return;
  if (opts.json) {
    writeJson({ ok: true, ...context });
    return;
  }

  const lines = [
    `Project: ${context.projectRoot}`,
    `Resolution: ${formatResolution(context.resolution)}`,
    `Config: ${context.config.exists ? context.config.path : `${context.config.path} (not initialized yet)`}`,
    `Framework: ${context.analysis.framework.kind} (${context.analysis.framework.confidence})`,
    `Styling: tailwind=${context.analysis.styling.tailwind}, cssVariables=${context.analysis.styling.cssVariables} (${context.analysis.styling.confidence})`,
    formatTheme(context.theme),
  ];

  process.stdout.write(`${lines.join('\n')}\n`);
}

function formatResolution(resolution: ProjectResolution): string {
  switch (resolution.kind) {
    case 'explicit':
      return `explicit --project (${resolution.requestedPath})`;
    case 'ancestor':
      return 'nearest ancestor app';
    case 'workspace_child':
      return `workspace child under ${resolution.workspaceRoot}`;
  }
}
