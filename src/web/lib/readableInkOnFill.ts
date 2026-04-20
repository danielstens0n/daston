/** WCAG-ish ink colors for UI copy on arbitrary hex fills (stock previews + themed props). */

function parseHexRgb(hex: string): [number, number, number] | null {
  const h = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(h)) {
    return [
      Number.parseInt(h.slice(1, 3), 16),
      Number.parseInt(h.slice(3, 5), 16),
      Number.parseInt(h.slice(5, 7), 16),
    ];
  }
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    const r = Number.parseInt(h.slice(1, 2) + h.slice(1, 2), 16);
    const g = Number.parseInt(h.slice(2, 3) + h.slice(2, 3), 16);
    const b = Number.parseInt(h.slice(3, 4) + h.slice(3, 4), 16);
    return [r, g, b];
  }
  return null;
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

const INK_ON_LIGHT = {
  heading: '#0f172a',
  body: '#334155',
  muted: '#475569',
} as const;

const INK_ON_DARK = {
  heading: '#f8fafc',
  body: '#e2e8f0',
  muted: '#cbd5e1',
} as const;

/** Pick heading / body / muted text colors that read on `fillHex` (defaults to light-surface ink if parse fails). */
export function readableInkOnFill(fillHex: string): {
  heading: string;
  body: string;
  muted: string;
} {
  const rgb = parseHexRgb(fillHex);
  if (!rgb) return { ...INK_ON_LIGHT };
  const L = relativeLuminance(rgb);
  return L > 0.45 ? { ...INK_ON_LIGHT } : { ...INK_ON_DARK };
}

/** Label color for text sitting directly on an accent-filled control. */
export function onAccentLabel(accentHex: string): string {
  const rgb = parseHexRgb(accentHex);
  if (!rgb) return '#ffffff';
  return relativeLuminance(rgb) > 0.55 ? INK_ON_LIGHT.heading : '#ffffff';
}
