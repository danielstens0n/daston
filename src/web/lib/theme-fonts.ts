import type { ThemeConfig } from '../../shared/types.ts';
import { DEFAULT_BODY_FONT_ID, DEFAULT_HEADING_FONT_ID, FONTS } from './fonts.ts';

export function themeFontNameToId(name: string | undefined, fallback: string): string {
  if (!name?.trim()) return fallback;
  const n = name.trim().toLowerCase();
  const hit = FONTS.find((f) => f.label.toLowerCase() === n);
  return hit?.id ?? fallback;
}

export function themeFontIds(theme: ThemeConfig): { heading: string; body: string } {
  return {
    heading: themeFontNameToId(theme.fonts.heading, DEFAULT_HEADING_FONT_ID),
    body: themeFontNameToId(theme.fonts.body, DEFAULT_BODY_FONT_ID),
  };
}
