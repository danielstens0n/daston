import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { dependencyNames } from '../shared/package-json.ts';

export type ResolveProjectResult =
  | { ok: true; projectRoot: string }
  | { ok: false; kind: 'invalid_path' | 'not_found' | 'ambiguous'; message: string; candidates?: string[] };

const APP_SIGNAL_DEPS = [
  'react',
  'react-dom',
  'next',
  'vite',
  'vue',
  'svelte',
  '@vitejs/plugin-react',
  '@tanstack/react-router',
  'preact',
  '@remix-run/react',
  'astro',
  'nuxt',
];

async function readPackageJson(dir: string): Promise<Record<string, unknown> | null> {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return null;
  const raw = await readFile(pkgPath, 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function isLikelyAppPackage(dir: string): Promise<boolean> {
  const pkg = await readPackageJson(dir);
  if (!pkg) return false;
  return dependencyNames(pkg).some((k) => APP_SIGNAL_DEPS.some((s) => k === s || k.startsWith(`${s}/`)));
}

export async function isWorkspaceRoot(dir: string): Promise<boolean> {
  const pkg = await readPackageJson(dir);
  if (pkg && 'workspaces' in pkg && pkg.workspaces !== undefined) return true;
  return existsSync(join(dir, 'pnpm-workspace.yaml'));
}

async function collectAppsIn(dir: string, into: Set<string>): Promise<void> {
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory() || e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (await isLikelyAppPackage(p)) into.add(p);
  }
}

async function findChildAppsNearRoot(root: string): Promise<string[]> {
  const found = new Set<string>();
  await collectAppsIn(root, found);
  await collectAppsIn(join(root, 'packages'), found);
  await collectAppsIn(join(root, 'apps'), found);
  return [...found].sort();
}

export async function resolveProject(options: {
  cwd: string;
  explicitProject?: string | undefined;
}): Promise<ResolveProjectResult> {
  const { cwd, explicitProject } = options;

  if (explicitProject !== undefined && explicitProject !== '') {
    const abs = resolve(cwd, explicitProject);
    const st = existsSync(abs) ? await stat(abs) : null;
    if (!st?.isDirectory()) {
      return { ok: false, kind: 'invalid_path', message: `Not a directory: ${explicitProject}` };
    }
    return { ok: true, projectRoot: abs };
  }

  for (const dir of ancestors(cwd)) {
    if (existsSync(join(dir, 'package.json')) && (await isLikelyAppPackage(dir))) {
      return { ok: true, projectRoot: dir };
    }
  }

  for (const dir of ancestors(cwd)) {
    if (!(await isWorkspaceRoot(dir))) continue;
    const apps = await findChildAppsNearRoot(dir);
    const [first, second] = apps;
    if (first !== undefined && second === undefined) {
      return { ok: true, projectRoot: first };
    }
    if (second !== undefined) {
      return {
        ok: false,
        kind: 'ambiguous',
        message: 'Multiple app packages found under this workspace. Pass --project <path> to choose one.',
        candidates: apps,
      };
    }
  }

  return {
    ok: false,
    kind: 'not_found',
    message:
      'Could not find a target project. Run from an app directory, a workspace root with one app package, or pass --project <path>.',
  };
}

function* ancestors(from: string): Generator<string> {
  let current = resolve(from);
  while (true) {
    yield current;
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

export function reportResolveFailure(result: Extract<ResolveProjectResult, { ok: false }>): void {
  process.stderr.write(`${result.message}\n`);
  if (result.candidates) {
    for (const c of result.candidates) {
      process.stderr.write(`  - ${c}\n`);
    }
  }
}
