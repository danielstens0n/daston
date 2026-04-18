import { Hono } from 'hono';
import type { ThemeConfig } from '../../shared/types.ts';
import { readThemeConfig, SCHEMA_VERSION, writeThemeConfig } from '../storage.ts';

export interface ThemeRoutesOptions {
  projectRoot: string;
}

export function createThemeRoutes({ projectRoot }: ThemeRoutesOptions): Hono {
  const router = new Hono();

  router.get('/', async (c) => {
    const theme = await readThemeConfig(projectRoot);
    return c.json(theme);
  });

  router.put('/', async (c) => {
    const body = await c.req.json().catch(() => null);
    const theme = parseFullTheme(body);
    if (!theme) return c.json({ error: 'invalid theme' }, 400);
    await writeThemeConfig(projectRoot, theme);
    return c.json(theme);
  });

  router.patch('/', async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!isObject(body)) return c.json({ error: 'invalid patch' }, 400);
    const current = await readThemeConfig(projectRoot);
    const next = mergeTheme(current, body);
    if (!next) return c.json({ error: 'invalid patch' }, 400);
    await writeThemeConfig(projectRoot, next);
    return c.json(next);
  });

  return router;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStringRecord(v: unknown): v is Record<string, string> {
  return isObject(v) && Object.values(v).every((x) => typeof x === 'string');
}

function parseFullTheme(input: unknown): ThemeConfig | null {
  if (!isObject(input)) return null;
  const fonts = input.fonts;
  const colors = input.colors;
  if (!isObject(fonts) || typeof fonts.heading !== 'string' || typeof fonts.body !== 'string') return null;
  if (!isStringRecord(colors)) return null;
  return {
    version: SCHEMA_VERSION,
    fonts: { heading: fonts.heading, body: fonts.body },
    colors: { ...colors },
  };
}

function mergeTheme(current: ThemeConfig, patch: Record<string, unknown>): ThemeConfig | null {
  const next: ThemeConfig = {
    version: SCHEMA_VERSION,
    fonts: { ...current.fonts },
    colors: { ...current.colors },
  };
  if ('fonts' in patch) {
    if (!isObject(patch.fonts)) return null;
    if (patch.fonts.heading !== undefined) {
      if (typeof patch.fonts.heading !== 'string') return null;
      next.fonts.heading = patch.fonts.heading;
    }
    if (patch.fonts.body !== undefined) {
      if (typeof patch.fonts.body !== 'string') return null;
      next.fonts.body = patch.fonts.body;
    }
  }
  if ('colors' in patch) {
    if (!isStringRecord(patch.colors)) return null;
    next.colors = { ...next.colors, ...patch.colors };
  }
  return next;
}
