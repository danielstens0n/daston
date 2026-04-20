// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { onAccentLabel, readableInkOnFill } from './readableInkOnFill.ts';

describe('readableInkOnFill', () => {
  it('returns dark ink on white and near-white fills', () => {
    expect(readableInkOnFill('#ffffff').heading).toBe('#0f172a');
    expect(readableInkOnFill('#f4f4f5').body).toBe('#334155');
  });

  it('returns light ink on dark fills', () => {
    const ink = readableInkOnFill('#0f172a');
    expect(ink.heading).toBe('#f8fafc');
    expect(ink.body).toBe('#e2e8f0');
  });

  it('falls back to dark ink when hex is unparseable', () => {
    expect(readableInkOnFill('transparent').heading).toBe('#0f172a');
  });
});

describe('onAccentLabel', () => {
  it('uses white on saturated blue accent', () => {
    expect(onAccentLabel('#0162ff')).toBe('#ffffff');
  });

  it('uses dark ink on light accent fills', () => {
    expect(onAccentLabel('#fde047')).toBe('#0f172a');
  });
});
