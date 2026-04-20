import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeThemeConfig } from '../../server/storage.ts';
import { promptAddComponent, promptApplyTheme } from './prompt.ts';

function chunkToString(chunk: string | Uint8Array): string {
  return typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
}

describe('prompt commands', () => {
  let appRoot: string;
  const roots: string[] = [];

  beforeEach(async () => {
    process.exitCode = undefined;
    appRoot = await mkdtemp(join(tmpdir(), 'daston-prompt-cli-'));
    roots.push(appRoot);
    await writeFile(
      join(appRoot, 'package.json'),
      `${JSON.stringify({ dependencies: { react: '^19.0.0' } })}\n`,
      'utf8',
    );
    await writeThemeConfig(appRoot, {
      version: 1,
      fonts: { heading: 'Serif', body: 'Mono' },
      colors: { brand: '#abc123' },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const r of roots.splice(0)) {
      await rm(r, { recursive: true, force: true });
    }
  });

  it('prints the apply-theme prompt as plain text by default', async () => {
    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += chunkToString(chunk);
      return true;
    });

    await promptApplyTheme({ project: appRoot });

    expect(stdout).toContain('Please update my project to use the following design theme:');
    expect(stdout).toContain('Heading font: Serif');
    expect(stdout).toContain('brand: #abc123');
  });

  it('prints structured json for add-component prompts', async () => {
    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += chunkToString(chunk);
      return true;
    });

    await promptAddComponent({ project: appRoot, component: 'button', json: true });

    const body = JSON.parse(stdout) as {
      ok: boolean;
      resolution: { kind: string };
      prompt: { kind: string; prompt: string };
      analysis: { framework: { kind: string } };
    };
    expect(body.ok).toBe(true);
    expect(body.resolution.kind).toBe('explicit');
    expect(body.analysis.framework.kind).toBe('react');
    expect(body.prompt.kind).toBe('add-component');
    expect(body.prompt.prompt).toContain('button component');
    expect(body.prompt.prompt).toContain('Heading font: Serif');
  });

  it('rejects unknown component ids', async () => {
    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += chunkToString(chunk);
      return true;
    });

    await promptAddComponent({ project: appRoot, component: 'unknown', json: true });

    const body = JSON.parse(stdout) as { ok: boolean; kind: string; message: string };
    expect(body.ok).toBe(false);
    expect(body.kind).toBe('invalid_component');
    expect(body.message).toContain('Unknown component id');
    expect(process.exitCode).toBe(1);
  });
});
