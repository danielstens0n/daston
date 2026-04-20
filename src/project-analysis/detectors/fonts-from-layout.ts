import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AnalysisFact, AnalysisSource, ThemeSeed } from '../../shared/types.ts';

function fontSrc(rel: string): AnalysisSource {
  return { path: rel, kind: 'font_file' };
}

const LAYOUT_CANDIDATES = ['app/layout.tsx', 'app/layout.jsx', 'src/app/layout.tsx', 'src/app/layout.jsx'];

/** Match import { Inter, Geist } from "next/font/google" and const x = Inter(...) */
function extractNextGoogleFonts(text: string): string[] {
  const names = new Set<string>();
  if (!text.includes('next/font')) return [];
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/g;
  let m = importRe.exec(text);
  while (m !== null) {
    const parts = (m[1] ?? '').split(',');
    for (const p of parts) {
      const name = p.trim().split(/\s+/)[0];
      if (name && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) names.add(name);
    }
    m = importRe.exec(text);
  }
  return [...names];
}

export async function detectFontsFromLayout(
  projectRoot: string,
  push: (f: AnalysisFact) => void,
  themeSeed: ThemeSeed,
): Promise<void> {
  for (const rel of LAYOUT_CANDIDATES) {
    const abs = join(projectRoot, rel);
    if (!existsSync(abs)) continue;
    const text = await readFile(abs, 'utf8');
    const fonts = extractNextGoogleFonts(text);
    if (fonts.length === 0) continue;

    push({
      id: 'fonts.next_font_google',
      value: fonts,
      confidence: 'high',
      sources: [fontSrc(rel)],
    });

    const label = fonts[0];
    if (label) {
      const readable = label.replace(/([A-Z])/g, ' $1').trim();
      const title = readable.charAt(0).toUpperCase() + readable.slice(1);
      if (!themeSeed.fonts.body) themeSeed.fonts.body = title;
      if (!themeSeed.fonts.heading) themeSeed.fonts.heading = title;
    }
    break;
  }
}
