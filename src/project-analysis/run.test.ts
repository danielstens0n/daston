import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runProjectAnalysis } from './run.ts';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'daston-pa-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('runProjectAnalysis', () => {
  it('detects Next.js from dependency and app router', async () => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { next: '^14.0.0', react: '^18.0.0' } }),
      'utf8',
    );
    await mkdir(join(root, 'app'), { recursive: true });
    await writeFile(join(root, 'app', 'page.tsx'), 'export default function Page() { return null }', 'utf8');
    const a = await runProjectAnalysis(root);
    expect(a.framework.kind).toBe('next');
    expect(a.framework.confidence).toBe('high');
    expect(a.facts.some((f) => f.id === 'router.next_app_dir')).toBe(true);
  });

  it('detects TanStack Router with vite and routes dir', async () => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { '@tanstack/react-router': '^1.0.0', react: '^19.0.0' } }),
      'utf8',
    );
    await writeFile(join(root, 'vite.config.ts'), 'export default {}', 'utf8');
    await mkdir(join(root, 'src', 'routes'), { recursive: true });
    await writeFile(join(root, 'src', 'routes', 'index.tsx'), 'export const Route = () => null', 'utf8');
    const a = await runProjectAnalysis(root);
    expect(a.framework.kind).toBe('tanstack-router');
    expect(a.facts.some((f) => f.id === 'router.tanstack_routes_dir')).toBe(true);
  });

  it('detects plain React', async () => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' } }),
      'utf8',
    );
    const a = await runProjectAnalysis(root);
    expect(a.framework.kind).toBe('react');
  });

  it('extracts tailwind color hints and marks styling', async () => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0', tailwindcss: '^3.4.0' } }),
      'utf8',
    );
    await writeFile(
      join(root, 'tailwind.config.js'),
      `module.exports = { theme: { extend: { colors: { primary: '#aabbcc' } } } }`,
      'utf8',
    );
    const a = await runProjectAnalysis(root);
    expect(a.styling.tailwind).toBe(true);
    expect(a.themeSeed.colors.primary).toBe('#aabbcc');
  });

  it('reads CSS variables from src/index.css', async () => {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { react: '^19.0.0' } }),
      'utf8',
    );
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(
      join(root, 'src', 'index.css'),
      `:root {\n  --background: #f5f5f5;\n  --foreground: #111111;\n}\n`,
      'utf8',
    );
    const a = await runProjectAnalysis(root);
    expect(a.styling.cssVariables).toBe(true);
    expect(a.themeSeed.colors.background).toBe('#f5f5f5');
    expect(a.themeSeed.colors.foreground).toBe('#111111');
  });
});
