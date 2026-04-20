import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AnalysisFact, AnalysisSource, ThemeSeed } from '../../shared/types.ts';

function stylesheetSource(rel: string): AnalysisSource {
  return { path: rel, kind: 'stylesheet' };
}

const CANDIDATE_FILES = [
  'src/index.css',
  'src/app/globals.css',
  'app/globals.css',
  'src/styles/globals.css',
  'styles/globals.css',
  'src/main.css',
  'src/App.css',
];

const TOKEN_NAMES = [
  'background',
  'foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'border',
  'ring',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
];

const MAX_BYTES = 120_000;

function extractCssVariables(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m = re.exec(css);
  while (m !== null) {
    const name = m[1];
    const raw = m[2]?.trim() ?? '';
    if (!name || !raw) continue;
    if (TOKEN_NAMES.includes(name) || name.startsWith('color-')) {
      const v = raw.replace(/\s*!important\s*$/i, '').trim();
      if (v.startsWith('#') || v.startsWith('hsl') || v.startsWith('rgb') || v.startsWith('oklch')) {
        out[name.replace(/-/g, '_')] = v;
      }
    }
    m = re.exec(css);
  }
  return out;
}

export async function detectCssTokens(
  projectRoot: string,
  push: (f: AnalysisFact) => void,
  themeSeed: ThemeSeed,
): Promise<void> {
  for (const rel of CANDIDATE_FILES) {
    const abs = join(projectRoot, rel);
    if (!existsSync(abs)) continue;
    const buf = await readFile(abs, 'utf8');
    const slice = buf.length > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
    const vars = extractCssVariables(slice);
    if (Object.keys(vars).length === 0) continue;

    push({
      id: 'css.variables',
      value: { file: rel, count: Object.keys(vars).length },
      confidence: 'medium',
      sources: [stylesheetSource(rel)],
    });

    const mapToColors: Record<string, string> = {};
    if (vars.background) mapToColors.background = vars.background;
    if (vars.foreground) mapToColors.foreground = vars.foreground;
    if (vars.primary) mapToColors.primary = vars.primary;
    if (vars.primary_foreground) mapToColors.primaryForeground = vars.primary_foreground;
    if (vars.muted_foreground) mapToColors.mutedForeground = vars.muted_foreground;
    if (vars.accent) mapToColors.accent = vars.accent;
    if (vars.border) mapToColors.border = vars.border;

    for (const [k, v] of Object.entries(mapToColors)) {
      if (!themeSeed.colors[k]) themeSeed.colors[k] = v;
    }

    push({
      id: 'css.token_values',
      value: mapToColors,
      confidence: 'medium',
      sources: [stylesheetSource(rel)],
    });
    break;
  }
}
