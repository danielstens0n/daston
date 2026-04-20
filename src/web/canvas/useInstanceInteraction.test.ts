import { describe, expect, it } from 'vitest';
import type { ComponentInstance, RectangleInstance, TextPrimitiveInstance } from '../state/types.ts';
import {
  constrainedDragPosition,
  resolveDrillTarget,
  SHIFT_AXIS_LOCK_THRESHOLD_PX,
} from './useInstanceInteraction.ts';

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

function rect(id: string, parentId: string | null): RectangleInstance {
  return {
    id,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    parentId,
    props: {
      fill: '#fff',
      fillEnabled: true,
      borderColor: '#000',
      borderWidth: 1,
      borderEnabled: true,
      borderRadius: 0,
      shadowEnabled: false,
      shadowColor: '#000',
      shadowBlur: 0,
      shadowOffsetY: 0,
    },
  };
}

function text(id: string, parentId: string | null): TextPrimitiveInstance {
  return {
    id,
    type: 'text',
    x: 0,
    y: 0,
    width: 50,
    height: 20,
    parentId,
    props: {
      text: 'hi',
      textColor: '#000',
      textAlign: 'left',
      textVerticalAlign: 'top',
      textLineHeight: 0,
      textLetterSpacing: 0,
      textCase: 'none',
      textParagraphSpacing: 0,
      textOverflow: 'clip',
      textAutoResize: 'fixed',
      textFont: 'f',
      textFontSize: 12,
      textFontWeight: 400,
      textItalic: false,
      textDecoration: 'none',
    },
  };
}

// Card-style tree: a root with one nested text child.
const nested: ComponentInstance[] = [rect('card', null), rect('group', 'card'), text('label', 'group')];

describe('resolveDrillTarget', () => {
  it('selects the outermost ancestor when no selection root is set', () => {
    expect(resolveDrillTarget(nested, 'label', null)).toEqual({
      targetId: 'card',
      clearSelectionRoot: false,
    });
  });

  it('selects the direct child of the selection root on the hit path', () => {
    expect(resolveDrillTarget(nested, 'label', 'card')).toEqual({
      targetId: 'group',
      clearSelectionRoot: false,
    });
  });

  it('selects the hit itself when the selection root equals the hit', () => {
    expect(resolveDrillTarget(nested, 'card', 'card')).toEqual({
      targetId: 'card',
      clearSelectionRoot: false,
    });
  });

  it('clears the selection root when hitting something outside it, reverting to outermost', () => {
    const instances: ComponentInstance[] = [...nested, rect('other', null)];
    expect(resolveDrillTarget(instances, 'other', 'card')).toEqual({
      targetId: 'other',
      clearSelectionRoot: true,
    });
  });

  it('already-root top-level instances stay the same with no selection root', () => {
    expect(resolveDrillTarget(nested, 'card', null)).toEqual({
      targetId: 'card',
      clearSelectionRoot: false,
    });
  });
});
