// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  collectDescendantIds,
  collectSubtreeIds,
  orderedInstanceIds,
  orderedSubtreeInstances,
  pickDropTarget,
} from './hierarchy.ts';
import type { ComponentInstance, RectangleInstance, TextPrimitiveInstance } from './types.ts';

function rect(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId: string | null,
): RectangleInstance {
  return {
    id,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    parentId,
    props: {
      fill: '#fff',
      borderColor: '#000',
      borderWidth: 1,
      borderRadius: 0,
      shadowEnabled: false,
      shadowColor: '#000',
      shadowBlur: 0,
      shadowOffsetY: 0,
    },
  };
}

function text(id: string, x: number, y: number, parentId: string | null): TextPrimitiveInstance {
  return {
    id,
    type: 'text',
    x,
    y,
    width: 50,
    height: 20,
    parentId,
    props: {
      text: 'hi',
      textColor: '#000',
      textAlign: 'left',
      textFont: 'f',
      textFontSize: 12,
      textFontWeight: 400,
      textItalic: false,
      textDecoration: 'none',
    },
  };
}

describe('collectDescendantIds', () => {
  it('walks every level of children exactly once', () => {
    const instances: ComponentInstance[] = [
      rect('r1', 0, 0, 100, 100, null),
      rect('r2', 10, 10, 40, 40, 'r1'),
      text('t1', 20, 20, 'r2'),
      text('t2', 60, 60, null),
    ];
    expect([...collectDescendantIds(instances, 'r1')]).toEqual(['r2', 't1']);
    expect([...collectDescendantIds(instances, 't2')]).toEqual([]);
  });
});

describe('collectSubtreeIds', () => {
  it('includes the root alongside every descendant', () => {
    const instances: ComponentInstance[] = [
      rect('r1', 0, 0, 100, 100, null),
      rect('r2', 10, 10, 40, 40, 'r1'),
    ];
    expect(collectSubtreeIds(instances, 'r1').has('r1')).toBe(true);
    expect(collectSubtreeIds(instances, 'r1').has('r2')).toBe(true);
  });
});

describe('orderedSubtreeInstances', () => {
  it('returns the root then descendants in render order', () => {
    const instances: ComponentInstance[] = [
      rect('r1', 0, 0, 100, 100, null),
      rect('r2', 200, 0, 100, 100, null),
      text('t1', 10, 10, 'r1'),
      text('t2', 210, 10, 'r2'),
    ];
    expect(orderedSubtreeInstances(instances, 'r1').map((i) => i.id)).toEqual(['r1', 't1']);
  });
});

describe('orderedInstanceIds', () => {
  it('emits roots first, then each subtree depth-first', () => {
    const instances: ComponentInstance[] = [
      rect('r1', 0, 0, 100, 100, null),
      rect('r2', 200, 0, 100, 100, null),
      text('t1', 10, 10, 'r1'),
      text('t2', 210, 10, 'r2'),
    ];
    expect(orderedInstanceIds(instances)).toEqual(['r1', 't1', 'r2', 't2']);
  });

  it('treats orphans whose parent is missing as root-level instances', () => {
    const instances: ComponentInstance[] = [
      rect('r1', 0, 0, 100, 100, null),
      text('ghost', 0, 0, 'missing-parent'),
    ];
    expect(orderedInstanceIds(instances)).toEqual(['r1', 'ghost']);
  });
});

describe('pickDropTarget', () => {
  it('returns the front-most container whose bounds cover the dragged center', () => {
    const instances: ComponentInstance[] = [
      rect('back', 0, 0, 200, 200, null),
      rect('front', 50, 50, 100, 100, null),
    ];
    const dragged = text('t', 80, 80, null);
    expect(pickDropTarget([...instances, dragged], 't', dragged)).toBe('front');
  });

  it('skips the dragged instance and its descendants so cycles cannot form', () => {
    const parent = rect('p', 0, 0, 200, 200, null);
    const childText = text('child', 20, 20, 'p');
    expect(pickDropTarget([parent, childText], 'p', parent)).toBeNull();
  });

  it('returns null when the dragged center lands on empty canvas', () => {
    const loner = text('t', 500, 500, null);
    expect(pickDropTarget([loner], 't', loner)).toBeNull();
  });
});
