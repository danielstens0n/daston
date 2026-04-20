import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveProject } from './resolve-project.ts';

async function writePkg(dir: string, body: Record<string, unknown>): Promise<void> {
  await writeFile(join(dir, 'package.json'), `${JSON.stringify(body)}\n`, 'utf8');
}

describe('resolveProject', () => {
  const roots: string[] = [];
  afterEach(async () => {
    for (const r of roots.splice(0)) {
      await rm(r, { recursive: true, force: true });
    }
  });

  it('uses an explicit --project directory', async () => {
    const app = await mkdtemp(join(tmpdir(), 'daston-rp-'));
    roots.push(app);
    const r = await resolveProject({ cwd: tmpdir(), explicitProject: app });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.projectRoot).toBe(app);
      expect(r.resolution).toEqual({ kind: 'explicit', requestedPath: app });
    }
  });

  it('rejects a non-directory explicit path', async () => {
    const r = await resolveProject({ cwd: tmpdir(), explicitProject: '/no/such/path/daston-xyz' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe('invalid_path');
  });

  it('walks upward to the nearest app package', async () => {
    const app = await mkdtemp(join(tmpdir(), 'daston-rp-'));
    roots.push(app);
    await writePkg(app, { dependencies: { react: '^19.0.0' } });
    const nested = join(app, 'src', 'components');
    await mkdir(nested, { recursive: true });
    const r = await resolveProject({ cwd: nested, explicitProject: undefined });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.projectRoot).toBe(app);
      expect(r.resolution).toEqual({ kind: 'ancestor' });
    }
  });

  it('picks the only child app in a workspace root', async () => {
    const ws = await mkdtemp(join(tmpdir(), 'daston-rp-'));
    roots.push(ws);
    await writePkg(ws, { workspaces: ['packages/*'] });
    const pkg = join(ws, 'packages', 'web');
    await mkdir(pkg, { recursive: true });
    await writePkg(pkg, { dependencies: { react: '^19.0.0' } });
    const r = await resolveProject({ cwd: ws, explicitProject: undefined });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.projectRoot).toBe(pkg);
      expect(r.resolution).toEqual({ kind: 'workspace_child', workspaceRoot: ws });
    }
  });

  it('returns ambiguous when multiple child apps exist', async () => {
    const ws = await mkdtemp(join(tmpdir(), 'daston-rp-'));
    roots.push(ws);
    await writePkg(ws, { workspaces: ['packages/*'] });
    const a = join(ws, 'packages', 'a');
    const b = join(ws, 'packages', 'b');
    await mkdir(a, { recursive: true });
    await mkdir(b, { recursive: true });
    await writePkg(a, { dependencies: { react: '^19.0.0' } });
    await writePkg(b, { dependencies: { react: '^19.0.0' } });
    const r = await resolveProject({ cwd: ws, explicitProject: undefined });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.kind).toBe('ambiguous');
      expect(r.candidates?.length).toBeGreaterThanOrEqual(2);
    }
  });
});
