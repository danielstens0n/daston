import { describe, expect, it } from 'vitest';
import {
  hexToHsva,
  hexToRgba,
  hsvaToHex,
  hsvaToRgba,
  mergeRgbHexWithAlpha,
  rgbaToHex,
  rgbaToHsva,
} from './color-math.ts';

describe('hexToRgba / rgbaToHex', () => {
  it('parses 6-char hex', () => {
    expect(hexToRgba('#18181b')).toEqual({ r: 24, g: 24, b: 27, a: 1 });
  });

  it('parses 8-char hex with alpha', () => {
    expect(hexToRgba('#ff000080')).toEqual({ r: 255, g: 0, b: 0, a: expect.closeTo(128 / 255, 5) });
  });

  it('parses 3-char shorthand', () => {
    expect(hexToRgba('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('returns null for invalid', () => {
    expect(hexToRgba('nope')).toBeNull();
    expect(hexToRgba('#gg0000')).toBeNull();
  });

  it('round-trips opaque', () => {
    const rgba = { r: 17, g: 34, b: 51, a: 1 };
    expect(hexToRgba(rgbaToHex(rgba))).toEqual(rgba);
  });

  it('round-trips semi-transparent', () => {
    const rgba = { r: 100, g: 200, b: 50, a: 0.5 };
    const hex = rgbaToHex(rgba);
    expect(hex).toMatch(/^#[0-9a-f]{8}$/);
    const parsed = hexToRgba(hex);
    expect(parsed).toMatchObject({ r: 100, g: 200, b: 50 });
    expect(parsed?.a).toBeCloseTo(0.5, 2);
  });

  it('outputs 6 chars when fully opaque', () => {
    expect(rgbaToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe('#000000');
  });

  it('outputs 8 chars when transparent', () => {
    expect(rgbaToHex({ r: 255, g: 255, b: 255, a: 0 })).toBe('#ffffff00');
  });
});

describe('hsv round-trip', () => {
  it('round-trips primary hues', () => {
    const samples = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#18181b'];
    for (const hex of samples) {
      const hsva = hexToHsva(hex);
      expect(hsva).not.toBeNull();
      if (!hsva) continue;
      const back = hsvaToHex(hsva);
      const rgba1 = hexToRgba(hex);
      const rgba2 = hexToRgba(back);
      expect(rgba1).not.toBeNull();
      expect(rgba2).not.toBeNull();
      if (!rgba1 || !rgba2) continue;
      expect(rgba2.r).toBeCloseTo(rgba1.r, 0);
      expect(rgba2.g).toBeCloseTo(rgba1.g, 0);
      expect(rgba2.b).toBeCloseTo(rgba1.b, 0);
      expect(rgba2.a).toBeCloseTo(rgba1.a, 5);
    }
  });

  it('preserves alpha through hsva', () => {
    const hsva = hexToHsva('#336699cc');
    expect(hsva).not.toBeNull();
    if (!hsva) return;
    expect(hsva.a).toBeGreaterThan(0.7);
    expect(hsva.a).toBeLessThan(0.9);
    const rgba = hsvaToRgba(hsva);
    expect(rgbaToHex(rgba).length).toBe(9);
  });
});

describe('rgbaToHsva / hsvaToRgba', () => {
  it('handles black (hue arbitrary at s=0)', () => {
    const hsva = rgbaToHsva({ r: 0, g: 0, b: 0, a: 1 });
    expect(hsva.v).toBe(0);
    expect(hsva.s).toBe(0);
  });

  it('handles white', () => {
    const hsva = rgbaToHsva({ r: 255, g: 255, b: 255, a: 1 });
    expect(hsva.v).toBeCloseTo(1, 5);
    expect(hsva.s).toBeCloseTo(0, 5);
  });
});

describe('mergeRgbHexWithAlpha', () => {
  it('combines 6-char hex with alpha', () => {
    expect(mergeRgbHexWithAlpha('#aabbcc', 0.25)).toBe('#aabbcc40');
  });
});
