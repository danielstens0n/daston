import { describe, expect, it } from 'vitest';
import {
  clampScale,
  normalizeWheelDelta,
  normalizeWorldRectCorners,
  screenToWorld,
  type ViewState,
  zoomAt,
} from './viewport-math.ts';

describe('zoomAt', () => {
  it('keeps the world point under the cursor invariant', () => {
    const view: ViewState = { x: 50, y: 30, scale: 1 };
    const cursor = { x: 200, y: 150 };
    const worldBefore = {
      x: (cursor.x - view.x) / view.scale,
      y: (cursor.y - view.y) / view.scale,
    };
    const next = zoomAt(view, cursor, 2);
    const worldAfter = {
      x: (cursor.x - next.x) / next.scale,
      y: (cursor.y - next.y) / next.scale,
    };
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 6);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 6);
    expect(next.scale).toBe(2);
  });

  it('returns the same view object when the scale is already clamped', () => {
    const view: ViewState = { x: 0, y: 0, scale: 4 };
    const next = zoomAt(view, { x: 100, y: 100 }, 2);
    expect(next).toBe(view);
  });

  it('clamps the resulting scale to the provided bounds', () => {
    const view: ViewState = { x: 0, y: 0, scale: 1 };
    expect(zoomAt(view, { x: 0, y: 0 }, 100).scale).toBe(4);
    expect(zoomAt(view, { x: 0, y: 0 }, 0.0001).scale).toBe(0.1);
  });
});

describe('clampScale', () => {
  it('respects bounds', () => {
    expect(clampScale(0.01, 0.1, 4)).toBe(0.1);
    expect(clampScale(10, 0.1, 4)).toBe(4);
    expect(clampScale(1, 0.1, 4)).toBe(1);
  });
});

describe('normalizeWorldRectCorners', () => {
  it('builds a normalized axis-aligned rect from diagonal corners', () => {
    expect(normalizeWorldRectCorners({ x: 10, y: 100 }, { x: 70, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 60,
      height: 80,
    });
  });
});

describe('screenToWorld', () => {
  it('inverts the canvas-world transform', () => {
    const view: ViewState = { x: 50, y: 30, scale: 2 };
    // World point (10, 20) maps to screen (50 + 10*2, 30 + 20*2) = (70, 70).
    expect(screenToWorld({ x: 70, y: 70 }, view)).toEqual({ x: 10, y: 20 });
  });

  it('is the identity when view is at origin with scale 1', () => {
    const view: ViewState = { x: 0, y: 0, scale: 1 };
    expect(screenToWorld({ x: 123, y: 456 }, view)).toEqual({ x: 123, y: 456 });
  });
});

describe('normalizeWheelDelta', () => {
  it('passes pixel-mode deltas through unchanged', () => {
    const event = { deltaMode: 0, deltaX: 12, deltaY: -8 } as WheelEvent;
    expect(normalizeWheelDelta(event)).toEqual({ dx: 12, dy: -8 });
  });

  it('scales line-mode deltas by 16', () => {
    const event = { deltaMode: 1, deltaX: 0, deltaY: 3 } as WheelEvent;
    expect(normalizeWheelDelta(event)).toEqual({ dx: 0, dy: 48 });
  });

  it('scales page-mode deltas by 100', () => {
    const event = { deltaMode: 2, deltaX: 0, deltaY: 1 } as WheelEvent;
    expect(normalizeWheelDelta(event)).toEqual({ dx: 0, dy: 100 });
  });
});
