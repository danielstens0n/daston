import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dependencyNames } from '../../shared/package-json.ts';
import type { AnalysisFact, AnalysisSource } from '../../shared/types.ts';

function source(path: string): AnalysisSource {
  return { path, kind: 'package_json' };
}

export async function detectPackageJson(projectRoot: string, push: (f: AnalysisFact) => void): Promise<void> {
  const path = join(projectRoot, 'package.json');
  if (!existsSync(path)) return;
  const raw = await readFile(path, 'utf8');
  const pkg = JSON.parse(raw) as Record<string, unknown>;
  const names = dependencyNames(pkg);
  const rel = 'package.json';

  push({
    id: 'pkg.dependencies',
    value: names,
    confidence: 'high',
    sources: [source(rel)],
  });

  if (names.includes('next')) {
    push({
      id: 'framework.next_dep',
      value: true,
      confidence: 'high',
      sources: [source(rel)],
    });
  }
  if (names.some((n) => n === '@tanstack/react-router' || n.startsWith('@tanstack/react-router/'))) {
    push({
      id: 'framework.tanstack_router_dep',
      value: true,
      confidence: 'high',
      sources: [source(rel)],
    });
  }
  if (names.includes('react') || names.some((n) => n.startsWith('react/'))) {
    push({
      id: 'framework.react_dep',
      value: true,
      confidence: 'high',
      sources: [source(rel)],
    });
  }
  if (names.some((n) => n === 'tailwindcss' || n.startsWith('@tailwindcss/'))) {
    push({
      id: 'styling.tailwind_dep',
      value: true,
      confidence: 'high',
      sources: [source(rel)],
    });
  }

  const name = typeof pkg.name === 'string' ? pkg.name : '';
  if (name) {
    push({
      id: 'pkg.name',
      value: name,
      confidence: 'high',
      sources: [source(rel)],
    });
  }
}
