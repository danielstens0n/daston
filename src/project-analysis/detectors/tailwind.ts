import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AnalysisFact, AnalysisSource, ThemeSeed } from '../../shared/types.ts';

function tailwindSource(rel: string): AnalysisSource {
  return { path: rel, kind: 'tailwind' };
}

const TAILWIND_NAMES = [
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
  'tailwind.config.ts',
];

/** Pull quoted strings after common color keys (very loose). */
function extractTailwindColorHints(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const patterns: { key: string; re: RegExp }[] = [
    { key: 'primary', re: /primary\s*:\s*['"]([^'"]+)['']/ },
    { key: 'secondary', re: /secondary\s*:\s*['"]([^'"]+)['']/ },
    { key: 'background', re: /background\s*:\s*['"]([^'"]+)['']/ },
    { key: 'foreground', re: /foreground\s*:\s*['"]([^'"]+)['']/ },
  ];
  for (const { key, re } of patterns) {
    const m = re.exec(text);
    if (m?.[1] && (m[1].startsWith('#') || m[1].startsWith('hsl') || m[1].startsWith('rgb'))) {
      out[key] = m[1];
    }
  }
  return out;
}

function extractFontFamilyHints(text: string): { sans?: string; serif?: string; mono?: string } {
  const out: { sans?: string; serif?: string; mono?: string } = {};
  const sans = /fontFamily\s*:\s*\{[^}]*sans\s*:\s*\[['"]([^'"]+)['"]/.exec(text);
  if (sans?.[1]) out.sans = sans[1];
  const serif = /serif\s*:\s*\[['"]([^'"]+)['"]/.exec(text);
  if (serif?.[1]) out.serif = serif[1];
  const mono = /mono\s*:\s*\[['"]([^'"]+)['"]/.exec(text);
  if (mono?.[1]) out.mono = mono[1];
  return out;
}

export async function detectTailwind(
  projectRoot: string,
  push: (f: AnalysisFact) => void,
  themeSeed: ThemeSeed,
): Promise<void> {
  let foundRel: string | null = null;
  for (const name of TAILWIND_NAMES) {
    if (existsSync(join(projectRoot, name))) {
      foundRel = name;
      break;
    }
  }
  if (!foundRel) return;

  push({
    id: 'tailwind.config_present',
    value: foundRel,
    confidence: 'high',
    sources: [tailwindSource(foundRel)],
  });

  const text = await readFile(join(projectRoot, foundRel), 'utf8');
  const colors = extractTailwindColorHints(text);
  for (const [k, v] of Object.entries(colors)) {
    if (!themeSeed.colors[k]) themeSeed.colors[k] = v;
  }
  if (Object.keys(colors).length > 0) {
    push({
      id: 'tailwind.theme_color_hints',
      value: colors,
      confidence: 'medium',
      sources: [tailwindSource(foundRel)],
    });
  }

  const fonts = extractFontFamilyHints(text);
  if (fonts.sans && !themeSeed.fonts.body) {
    const first =
      fonts.sans
        .split(',')[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, '') ?? null;
    if (first) {
      themeSeed.fonts.body = first;
      themeSeed.fonts.heading = themeSeed.fonts.heading ?? first;
    }
    push({
      id: 'tailwind.fontFamily_sans',
      value: fonts.sans,
      confidence: 'medium',
      sources: [tailwindSource(foundRel)],
    });
  }
  if (fonts.serif && !themeSeed.fonts.heading) {
    const first =
      fonts.serif
        .split(',')[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, '') ?? null;
    if (first) themeSeed.fonts.heading = first;
  }
}
