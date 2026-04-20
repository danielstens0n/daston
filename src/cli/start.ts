import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { runProjectAnalysis } from '../project-analysis/run.ts';
import { themeSeedToThemeConfig } from '../project-analysis/theme-from-seed.ts';
import { createServer } from '../server/index.ts';
import { projectConfigPath, writeThemeConfig } from '../server/storage.ts';
import { bundledWebRoot } from './paths.ts';
import { getAvailablePort } from './port.ts';
import { reportResolveFailure, resolveProject } from './resolve-project.ts';

export interface StartOptions {
  project?: string | undefined;
  port?: number | undefined;
  /** Commander sets this to `false` when the user passes `--no-open`; defaults to true otherwise. */
  open?: boolean | undefined;
  /** Override built SPA root (e.g. tests). Defaults to `<daston package>/dist/web`. */
  webRoot?: string | undefined;
}

export async function start(opts: StartOptions): Promise<void> {
  const resolved = await resolveProject({ cwd: process.cwd(), explicitProject: opts.project });
  if (!resolved.ok) {
    reportResolveFailure(resolved);
    process.exitCode = 1;
    return;
  }

  const webRoot = opts.webRoot ?? bundledWebRoot(import.meta.url);
  const indexHtml = join(webRoot, 'index.html');
  if (!existsSync(indexHtml)) {
    process.stderr.write(
      `Web bundle not found (expected ${indexHtml}). Run \`npm run build\` in the daston package, then retry.\n`,
    );
    process.exitCode = 1;
    return;
  }

  await ensureProjectInitialized(resolved.projectRoot);

  const app = createServer({ projectRoot: resolved.projectRoot, webRoot });
  const port = opts.port ?? (await getAvailablePort());
  const shouldOpen = opts.open !== false;

  serve({ fetch: app.fetch.bind(app), port, hostname: '127.0.0.1' }, (info) => {
    const url = `http://127.0.0.1:${info.port}/`;
    process.stdout.write(
      `Daston canvas ready at ${url}\nProject: ${resolved.projectRoot}\nPress Ctrl+C to stop\n`,
    );
    if (shouldOpen) openInBrowser(url);
  });
}

async function ensureProjectInitialized(projectRoot: string): Promise<void> {
  const configPath = projectConfigPath(projectRoot);
  if (existsSync(configPath)) return;
  const analysis = await runProjectAnalysis(projectRoot);
  await writeThemeConfig(projectRoot, themeSeedToThemeConfig(analysis.themeSeed));
}

function openInBrowser(url: string): void {
  const plat = platform();
  const command = plat === 'darwin' ? 'open' : plat === 'win32' ? 'cmd' : 'xdg-open';
  const args = plat === 'win32' ? ['/c', 'start', '""', url] : [url];
  const child = spawn(command, args, { stdio: 'ignore', detached: true });
  child.on('error', () => {
    // Swallowed by design: failing to auto-open is non-fatal.
  });
  child.unref();
}
