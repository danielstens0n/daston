// @vitest-environment node

import { describe, expect, it } from 'vitest';
import type { ComponentInstance, RectangleInstance } from '../state/types.ts';
import { computeReorderTarget } from './layer-reorder.ts';

function rect(id: string, parentId: string | null): RectangleInstance {
  return {
    id,
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    parentId,
    props: {
      fill: '#fff',
      borderColor: '#000',
      borderWidth: 0,
      borderRadius: 0,
      shadowEnabled: false,
      shadowColor: '#000',
      shadowBlur: 0,
      shadowOffsetY: 0,
    },
  };
}

describe('computeReorderTarget', () => {
  it('onto a row always reparents under it (beforeId stays null)', () => {
    const instances: ComponentInstance[] = [rect('a', null), rect('b', null)];
    expect(computeReorderTarget(instances, 'a', 'b', 'onto', true)).toEqual({
      parentId: 'b',
      beforeId: null,
    });
  });

  it('root-level above target inserts at array index after target (sidebar is reversed)', () => {
    // Array [a, b, c] displays as [c, b, a] — dropping X above b visually
    // means placing X between c and b in the array, i.e. before c.
    const instances: ComponentInstance[] = [rect('a', null), rect('b', null), rect('c', null)];
    expect(computeReorderTarget(instances, 'x', 'b', 'above', true)).toEqual({
      parentId: null,
      beforeId: 'c',
    });
  });

  it('root-level above the topmost visible (last in array) appends at end', () => {
    const instances: ComponentInstance[] = [rect('a', null), rect('b', null), rect('c', null)];
    expect(computeReorderTarget(instances, 'x', 'c', 'above', true)).toEqual({
      parentId: null,
      beforeId: null,
    });
  });

  it('root-level below target inserts just before target in the array', () => {
    const instances: ComponentInstance[] = [rect('a', null), rect('b', null), rect('c', null)];
    expect(computeReorderTarget(instances, 'x', 'b', 'below', true)).toEqual({
      parentId: null,
      beforeId: 'b',
    });
  });

  it('sublist above target matches array order (before target)', () => {
    const instances: ComponentInstance[] = [rect('p', null), rect('a', 'p'), rect('b', 'p')];
    expect(computeReorderTarget(instances, 'x', 'b', 'above', false)).toEqual({
      parentId: 'p',
      beforeId: 'b',
    });
  });

  it('sublist below the last sibling appends at end of siblings', () => {
    const instances: ComponentInstance[] = [rect('p', null), rect('a', 'p'), rect('b', 'p')];
    expect(computeReorderTarget(instances, 'x', 'b', 'below', false)).toEqual({
      parentId: 'p',
      beforeId: null,
    });
  });

  it('returns null when dragged equals target', () => {
    const instances: ComponentInstance[] = [rect('a', null)];
    expect(computeReorderTarget(instances, 'a', 'a', 'onto', true)).toBeNull();
  });

  it('returns null when target does not exist', () => {
    const instances: ComponentInstance[] = [rect('a', null)];
    expect(computeReorderTarget(instances, 'a', 'ghost', 'above', true)).toBeNull();
  });
});
