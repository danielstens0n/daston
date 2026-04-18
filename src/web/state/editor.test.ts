import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editor.ts';
import type { CardInstance } from './types.ts';

// Reset the store to a known two-instance baseline before each test. We
// exercise the store via its direct get/setters (no React) — selector hooks
// are just `useEditorStore(selector)` wrappers.

const baselineA: CardInstance = {
  id: 'a',
  type: 'card',
  x: 10,
  y: 20,
  props: {
    width: 280,
    padding: 20,
    fill: '#ffffff',
    borderColor: '#e4e4e7',
    borderWidth: 1,
    borderRadius: 12,
    shadowEnabled: true,
    shadowColor: '#0000001a',
    shadowBlur: 12,
    shadowOffsetY: 4,
    titleColor: '#18181b',
    bodyColor: '#52525b',
  },
};

const baselineB: CardInstance = { ...baselineA, id: 'b', x: 200, y: 200 };

beforeEach(() => {
  useEditorStore.setState({ instances: [baselineA, baselineB], selectedId: null });
});

describe('select', () => {
  it('sets and clears selectedId', () => {
    useEditorStore.getState().select('a');
    expect(useEditorStore.getState().selectedId).toBe('a');
    useEditorStore.getState().select(null);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });
});

describe('move', () => {
  it('updates only the matching instance position', () => {
    useEditorStore.getState().move('a', { x: 111, y: 222 });
    const { instances } = useEditorStore.getState();
    expect(instances[0]).toMatchObject({ id: 'a', x: 111, y: 222 });
    expect(instances[1]).toEqual(baselineB);
  });

  it('leaves props untouched on the moved instance', () => {
    useEditorStore.getState().move('a', { x: 1, y: 1 });
    expect(useEditorStore.getState().instances[0]?.props).toEqual(baselineA.props);
  });
});

describe('updateProps', () => {
  it('merges partial patches without overwriting other keys', () => {
    useEditorStore.getState().updateProps('a', { fill: '#ff0000', borderRadius: 8 });
    const updated = useEditorStore.getState().instances[0];
    expect(updated?.props).toMatchObject({
      ...baselineA.props,
      fill: '#ff0000',
      borderRadius: 8,
    });
  });

  it('does not affect other instances', () => {
    useEditorStore.getState().updateProps('a', { fill: '#ff0000' });
    expect(useEditorStore.getState().instances[1]).toEqual(baselineB);
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().updateProps('missing', { fill: '#ff0000' });
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
  });
});
