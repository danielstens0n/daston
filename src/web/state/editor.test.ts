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
  width: 280,
  height: 180,
  props: {
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
  useEditorStore.setState({
    instances: [baselineA, baselineB],
    selectedId: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
  });
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

describe('resize', () => {
  it('updates x, y, width, and height together', () => {
    useEditorStore.getState().resize('a', { x: 50, y: 60, width: 400, height: 300 });
    expect(useEditorStore.getState().instances[0]).toMatchObject({
      id: 'a',
      x: 50,
      y: 60,
      width: 400,
      height: 300,
    });
  });

  it('clamps width and height to the minimum', () => {
    useEditorStore.getState().resize('a', { x: 0, y: 0, width: 5, height: 10 });
    const updated = useEditorStore.getState().instances[0];
    expect(updated?.width).toBe(40);
    expect(updated?.height).toBe(40);
  });

  it('does not affect other instances', () => {
    useEditorStore.getState().resize('a', { x: 0, y: 0, width: 100, height: 100 });
    expect(useEditorStore.getState().instances[1]).toEqual(baselineB);
  });

  it('leaves props untouched', () => {
    useEditorStore.getState().resize('a', { x: 0, y: 0, width: 100, height: 100 });
    expect(useEditorStore.getState().instances[0]?.props).toEqual(baselineA.props);
  });
});

describe('addInstance', () => {
  it('centers a new card at the given world point', () => {
    useEditorStore.getState().addInstance('card', { x: 500, y: 400 });
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'card',
      x: 500 - 280 / 2,
      y: 400 - 180 / 2,
      width: 280,
      height: 180,
    });
  });

  it('selects the new instance', () => {
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe(state.instances.at(-1)?.id);
  });

  it('assigns a unique id on each call', () => {
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    const state = useEditorStore.getState();
    const ids = state.instances.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(state.nextInstanceId).toBe(4);
  });

  it('throws for component types that are not implemented yet', () => {
    expect(() => useEditorStore.getState().addInstance('button', { x: 0, y: 0 })).toThrow();
    expect(() => useEditorStore.getState().addInstance('table', { x: 0, y: 0 })).toThrow();
    expect(() => useEditorStore.getState().addInstance('landing', { x: 0, y: 0 })).toThrow();
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
