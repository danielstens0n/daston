import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { createServer } from '../../server/index.ts';
import { bundledWebRoot } from '../paths.ts';
import { getAvailablePort } from '../port.ts';
import { reportResolveFailure, resolveProject } from '../resolve-project.ts';

export interface StartOptions {
  project?: string | undefined;
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
  const app = createServer({ projectRoot: resolved.projectRoot, webRoot });
  const port = await getAvailablePort();
  serve({ fetch: app.fetch.bind(app), port, hostname: '127.0.0.1' }, (info) => {
    process.stdout.write(`http://127.0.0.1:${info.port}/\n`);
  });
}
