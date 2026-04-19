import { describe, expect, it } from 'vitest';
import { resizeRect, type ResizeRect } from './useResizeInteraction.ts';

// Pure-function tests for the resize math. The hook itself is exercised
// visually — these cover the two interesting cases per corner: free resize
// inside the valid range, and the clamp-pin when the dragged corner would
// cross the opposite anchor. MIN_SIZE in the hook is 40.

const base: ResizeRect = { x: 100, y: 100, width: 200, height: 120 };

describe('resizeRect — SE', () => {
  it('grows width and height by the delta', () => {
    expect(resizeRect(base, 'se', 30, 20)).toEqual({
      x: 100,
      y: 100,
      width: 230,
      height: 140,
    });
  });

  it('clamps to the minimum; x/y never move', () => {
    const result = resizeRect(base, 'se', -1000, -1000);
    expect(result).toEqual({ x: 100, y: 100, width: 40, height: 40 });
  });
});

describe('resizeRect — SW', () => {
  it('moves x and shrinks width; height grows by dy', () => {
    // anchorX = 300. Drag x right by 30: new x = 130, width = 170.
    expect(resizeRect(base, 'sw', 30, 20)).toEqual({
      x: 130,
      y: 100,
      width: 170,
      height: 140,
    });
  });

  it('pins the right edge when width would cross the minimum', () => {
    // anchorX = 300. Pushing x past 260 (=300-40) must not slide further.
    const result = resizeRect(base, 'sw', 1000, 0);
    expect(result).toEqual({ x: 260, y: 100, width: 40, height: 120 });
  });
});

describe('resizeRect — NE', () => {
  it('moves y and shrinks height; width grows by dx', () => {
    // anchorY = 220. Drag y down by 30: new y = 130, height = 90.
    expect(resizeRect(base, 'ne', 30, 30)).toEqual({
      x: 100,
      y: 130,
      width: 230,
      height: 90,
    });
  });

  it('pins the bottom edge when height would cross the minimum', () => {
    // anchorY = 220. Pushing y past 180 (=220-40) must not slide further.
    const result = resizeRect(base, 'ne', 0, 1000);
    expect(result).toEqual({ x: 100, y: 180, width: 200, height: 40 });
  });
});

describe('resizeRect — NW', () => {
  it('moves x and y; shrinks width and height', () => {
    // anchorX = 300, anchorY = 220. Drag both axes down-right by 20.
    expect(resizeRect(base, 'nw', 20, 20)).toEqual({
      x: 120,
      y: 120,
      width: 180,
      height: 100,
    });
  });

  it('pins both far edges when both dimensions hit the minimum', () => {
    // anchorX=300, anchorY=220. Push both axes past the limit.
    const result = resizeRect(base, 'nw', 1000, 1000);
    expect(result).toEqual({ x: 260, y: 180, width: 40, height: 40 });
  });

  it('can expand again after pinning', () => {
    const pinned = resizeRect(base, 'nw', 1000, 1000);
    // Now drag back toward the anchor (negative dx/dy grows the rect).
    const expanded = resizeRect(pinned, 'nw', -60, -40);
    expect(expanded).toEqual({ x: 200, y: 140, width: 100, height: 80 });
  });
});
