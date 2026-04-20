import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeThemeConfig } from '../../server/storage.ts';
import { inspect } from './inspect.ts';

function chunkToString(chunk: string | Uint8Array): string {
  return typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
}

describe('inspect', () => {
  let appRoot: string;
  const roots: string[] = [];

  beforeEach(async () => {
    process.exitCode = undefined;
    appRoot = await mkdtemp(join(tmpdir(), 'daston-inspect-'));
    roots.push(appRoot);
    await writeFile(
      join(appRoot, 'package.json'),
      `${JSON.stringify({ dependencies: { react: '^19.0.0', tailwindcss: '^4.0.0' } })}\n`,
      'utf8',
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const r of roots.splice(0)) {
      await rm(r, { recursive: true, force: true });
    }
  });

  it('prints structured json for the resolved project', async () => {
    await writeThemeConfig(appRoot, {
      version: 1,
      fonts: { heading: 'Serif', body: 'Sans' },
      colors: { primary: '#123456' },
    });

    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += chunkToString(chunk);
      return true;
    });

    await inspect({ project: appRoot, json: true });

    const body = JSON.parse(stdout) as {
      ok: boolean;
      projectRoot: string;
      resolution: { kind: string };
      config: { exists: boolean };
      theme: { fonts: { heading: string }; colors: Record<string, string> };
      analysis: { framework: { kind: string } };
    };
    expect(body.ok).toBe(true);
    expect(body.projectRoot).toBe(appRoot);
    expect(body.resolution.kind).toBe('explicit');
    expect(body.config.exists).toBe(true);
    expect(body.theme.fonts.heading).toBe('Serif');
    expect(body.theme.colors.primary).toBe('#123456');
    expect(body.analysis.framework.kind).toBe('react');
  });

  it('prints a human summary by default', async () => {
    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += chunkToString(chunk);
      return true;
    });

    await inspect({ project: appRoot });

    expect(stdout).toContain(`Project: ${appRoot}`);
    expect(stdout).toContain('Framework: react');
    expect(stdout).toContain('- Heading font: Inter');
  });
});
