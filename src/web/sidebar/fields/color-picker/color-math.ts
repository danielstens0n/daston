/** RGB channels 0–255, alpha 0–1. */
export type Rgba = { r: number; g: number; b: number; a: number };

/** Hue 0–360°, saturation and value 0–1. */
export type Hsva = { h: number; s: number; v: number; a: number };

/** Committed hex in the sidebar: `#rrggbb` or `#rrggbbaa` (same as picker + text field). */
export const HEX_6_OR_8_RE = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

const HEX6 = /^#?([0-9a-fA-F]{6})$/;
const HEX8 = /^#?([0-9a-fA-F]{8})$/;

export function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function byteToAlpha(byte: number): number {
  return clamp01(byte / 255);
}

function alphaToByte(a: number): number {
  return clamp255(a * 255);
}

/** Parse #rgb, #rrggbb, or #rrggbbaa into RGBA. Invalid input returns null. */
export function hexToRgba(hex: string): Rgba | null {
  const t = hex.trim();
  if (t.length === 0) return null;
  const withHash = t.startsWith('#') ? t : `#${t}`;
  const m8 = HEX8.exec(withHash);
  if (m8?.[1]) {
    const raw = m8[1];
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    const aByte = Number.parseInt(raw.slice(6, 8), 16);
    if ([r, g, b, aByte].some((x) => Number.isNaN(x))) return null;
    return { r, g, b, a: byteToAlpha(aByte) };
  }
  const m6 = HEX6.exec(withHash);
  if (m6?.[1]) {
    const raw = m6[1];
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b, a: 1 };
  }
  const raw3 = withHash.replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(raw3) && raw3.length === 3) {
    const c0 = raw3[0];
    const c1 = raw3[1];
    const c2 = raw3[2];
    if (c0 === undefined || c1 === undefined || c2 === undefined) return null;
    const r = Number.parseInt(c0 + c0, 16);
    const g = Number.parseInt(c1 + c1, 16);
    const b = Number.parseInt(c2 + c2, 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b, a: 1 };
  }
  return null;
}

/** Canonical hex: #rrggbb if fully opaque, else #rrggbbaa (lowercase). */
export function rgbaToHex({ r, g, b, a }: Rgba): string {
  const rr = clamp255(r).toString(16).padStart(2, '0');
  const gg = clamp255(g).toString(16).padStart(2, '0');
  const bb = clamp255(b).toString(16).padStart(2, '0');
  if (a >= 1) return `#${rr}${gg}${bb}`;
  const aa = alphaToByte(a).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}${aa}`;
}

/** RGB 0–255 → HSV; hue in degrees 0–360. */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = clamp255(r) / 255;
  const gn = clamp255(g) / 255;
  const bn = clamp255(b) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 1e-10) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return {
    h: (((h % 1) + 1) % 1) * 360,
    s: max === 0 ? 0 : d / max,
    v: max,
  };
}

/** HSV → RGB channels 0–255. */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = ((((h % 360) + 360) % 360) / 60) % 6;
  const i = Math.floor(hh);
  const f = hh - i;
  const p = v * (1 - clamp01(s));
  const q = v * (1 - f * clamp01(s));
  const t = v * (1 - (1 - f) * clamp01(s));
  const max = clamp01(v);
  let rn = 0;
  let gn = 0;
  let bn = 0;
  switch (i) {
    case 0:
      rn = max;
      gn = t;
      bn = p;
      break;
    case 1:
      rn = q;
      gn = max;
      bn = p;
      break;
    case 2:
      rn = p;
      gn = max;
      bn = t;
      break;
    case 3:
      rn = p;
      gn = q;
      bn = max;
      break;
    case 4:
      rn = t;
      gn = p;
      bn = max;
      break;
    default:
      rn = max;
      gn = p;
      bn = q;
  }
  return { r: clamp255(rn * 255), g: clamp255(gn * 255), b: clamp255(bn * 255) };
}

export function rgbaToHsva(rgba: Rgba): Hsva {
  const { h, s, v } = rgbToHsv(rgba.r, rgba.g, rgba.b);
  return { h, s, v, a: clamp01(rgba.a) };
}

export function hsvaToRgba(hsva: Hsva): Rgba {
  const { r, g, b } = hsvToRgb(hsva.h, hsva.s, hsva.v);
  return { r, g, b, a: clamp01(hsva.a) };
}

export function hexToHsva(hex: string): Hsva | null {
  const rgba = hexToRgba(hex);
  if (!rgba) return null;
  return rgbaToHsva(rgba);
}

export function hsvaToHex(hsva: Hsva): string {
  return rgbaToHex(hsvaToRgba(hsva));
}

/** Merge #rrggbb from eyedropper with existing alpha from current HSVA. */
export function mergeRgbHexWithAlpha(sRGBHex: string, alpha: number): string | null {
  const base = hexToRgba(sRGBHex);
  if (!base) return null;
  return rgbaToHex({ ...base, a: clamp01(alpha) });
}
