import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { AnalysisFact, AnalysisSource } from '../../shared/types.ts';

function src(rel: string): AnalysisSource {
  return { path: rel, kind: 'router' };
}

function cfg(rel: string): AnalysisSource {
  return { path: rel, kind: 'config' };
}

async function dirHasFiles(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return false;
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.some((e) => e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.jsx')));
}

export async function detectNextAndRouter(
  projectRoot: string,
  push: (f: AnalysisFact) => void,
): Promise<void> {
  const nextConfigs = ['next.config.js', 'next.config.mjs', 'next.config.cjs', 'next.config.ts'];
  for (const name of nextConfigs) {
    const rel = name;
    if (existsSync(join(projectRoot, name))) {
      push({
        id: 'next.config_present',
        value: name,
        confidence: 'high',
        sources: [cfg(rel)],
      });
      break;
    }
  }

  const appRouter = join(projectRoot, 'app');
  const srcApp = join(projectRoot, 'src', 'app');
  const pages = join(projectRoot, 'pages');
  const srcPages = join(projectRoot, 'src', 'pages');

  if (await dirHasFiles(appRouter)) {
    push({
      id: 'router.next_app_dir',
      value: 'app',
      confidence: 'high',
      sources: [src('app')],
    });
  } else if (await dirHasFiles(srcApp)) {
    push({
      id: 'router.next_app_dir',
      value: 'src/app',
      confidence: 'high',
      sources: [src('src/app')],
    });
  }

  const hasPagesRoot = existsSync(pages);
  const hasSrcPagesRoot = existsSync(srcPages);
  if (hasPagesRoot || hasSrcPagesRoot) {
    const rel = hasSrcPagesRoot ? 'src/pages' : 'pages';
    push({
      id: 'router.next_pages_dir',
      value: rel,
      confidence: 'high',
      sources: [src(rel)],
    });
  }

  const viteConfig = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'];
  for (const name of viteConfig) {
    if (existsSync(join(projectRoot, name))) {
      push({
        id: 'bundler.vite_config',
        value: name,
        confidence: 'high',
        sources: [cfg(name)],
      });
      break;
    }
  }

  const tanstackRoutes = [join(projectRoot, 'src', 'routes'), join(projectRoot, 'routes')];
  for (const dir of tanstackRoutes) {
    if (existsSync(dir)) {
      const relPath = relative(projectRoot, dir).replace(/\\/g, '/');
      push({
        id: 'router.tanstack_routes_dir',
        value: relPath,
        confidence: 'medium',
        sources: [src(relPath)],
      });
      break;
    }
  }
}
