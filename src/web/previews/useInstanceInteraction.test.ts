import { describe, expect, it } from 'vitest';
import { constrainedDragPosition, SHIFT_AXIS_LOCK_THRESHOLD_PX } from './useInstanceInteraction.ts';

const t = SHIFT_AXIS_LOCK_THRESHOLD_PX;

describe('constrainedDragPosition', () => {
  it('passes through unconstrained position when Shift is not held', () => {
    expect(constrainedDragPosition(0, 0, 50, 30, false, t)).toEqual({ x: 50, y: 30 });
  });

  it('does not lock until movement from origin reaches the threshold', () => {
    expect(constrainedDragPosition(100, 100, 103, 102, true, t)).toEqual({ x: 103, y: 102 });
  });

  it('locks to horizontal when |dx| >= |dy| past the threshold', () => {
    expect(constrainedDragPosition(100, 100, 120, 105, true, t)).toEqual({ x: 120, y: 100 });
  });

  it('locks to vertical when |dy| > |dx| past the threshold', () => {
    expect(constrainedDragPosition(100, 100, 105, 120, true, t)).toEqual({ x: 100, y: 120 });
  });

  it('matches |dx| and |dy| by preferring horizontal lock', () => {
    expect(constrainedDragPosition(0, 0, 10, -10, true, t)).toEqual({ x: 10, y: 0 });
  });

  it('with Shift off, returns full unconstrained position even if it was axis-locked before', () => {
    const locked = constrainedDragPosition(100, 100, 120, 105, true, t);
    expect(locked).toEqual({ x: 120, y: 100 });
    expect(constrainedDragPosition(100, 100, 120, 105, false, t)).toEqual({ x: 120, y: 105 });
  });
});
