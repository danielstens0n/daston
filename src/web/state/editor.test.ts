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

  it('centers a new button at the given world point', () => {
    useEditorStore.getState().addInstance('button', { x: 100, y: 80 });
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'button',
      x: 100 - 160 / 2,
      y: 80 - 44 / 2,
      width: 160,
      height: 44,
    });
  });

  it('centers a new table at the given world point', () => {
    useEditorStore.getState().addInstance('table', { x: 200, y: 150 });
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'table',
      x: 200 - 320 / 2,
      y: 150 - 220 / 2,
      width: 320,
      height: 220,
    });
  });

  it('centers a new landing page at the given world point', () => {
    useEditorStore.getState().addInstance('landing', { x: 300, y: 240 });
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'landing',
      x: 300 - 360 / 2,
      y: 240 - 480 / 2,
      width: 360,
      height: 480,
    });
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

describe('remove', () => {
  it('drops the matching instance and leaves others alone', () => {
    useEditorStore.getState().remove('a');
    const { instances } = useEditorStore.getState();
    expect(instances).toEqual([baselineB]);
  });

  it('clears selectedId when it matches the removed id', () => {
    useEditorStore.getState().select('a');
    useEditorStore.getState().remove('a');
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('leaves selectedId alone when a different instance is removed', () => {
    useEditorStore.getState().select('b');
    useEditorStore.getState().remove('a');
    expect(useEditorStore.getState().selectedId).toBe('b');
  });

  it('clears lastPasteId when the removed instance was the last paste', () => {
    useEditorStore.setState({ lastPasteId: 'a' });
    useEditorStore.getState().remove('a');
    expect(useEditorStore.getState().lastPasteId).toBeNull();
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().remove('missing');
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
  });
});

describe('duplicate', () => {
  it('clones the instance with +20 offset on x and y', () => {
    useEditorStore.getState().duplicate('a');
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'card',
      x: baselineA.x + 20,
      y: baselineA.y + 20,
      width: baselineA.width,
      height: baselineA.height,
      props: baselineA.props,
    });
  });

  it('assigns a fresh id and bumps the counter', () => {
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    expect(state.instances.at(-1)?.id).toBe('card-2');
    expect(state.nextInstanceId).toBe(3);
  });

  it('selects the new instance', () => {
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe(state.instances.at(-1)?.id);
  });

  it('does not touch clipboard or lastPasteId', () => {
    useEditorStore.setState({ clipboard: baselineB, lastPasteId: 'b' });
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    expect(state.clipboard).toBe(baselineB);
    expect(state.lastPasteId).toBe('b');
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().duplicate('missing');
    const state = useEditorStore.getState();
    expect(state.instances).toEqual([baselineA, baselineB]);
    expect(state.nextInstanceId).toBe(2);
  });
});

describe('copy', () => {
  it('stores a snapshot in clipboard', () => {
    useEditorStore.getState().copy('a');
    expect(useEditorStore.getState().clipboard).toEqual(baselineA);
  });

  it('resets lastPasteId so the next paste starts fresh', () => {
    useEditorStore.setState({ lastPasteId: 'b' });
    useEditorStore.getState().copy('a');
    expect(useEditorStore.getState().lastPasteId).toBeNull();
  });

  it('does not mutate instances', () => {
    useEditorStore.getState().copy('a');
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().copy('missing');
    expect(useEditorStore.getState().clipboard).toBeNull();
  });
});

describe('cut', () => {
  it('stores the snapshot and removes the source', () => {
    useEditorStore.getState().cut('a');
    const state = useEditorStore.getState();
    expect(state.clipboard).toEqual(baselineA);
    expect(state.instances).toEqual([baselineB]);
  });

  it('clears selectedId when the cut instance was selected', () => {
    useEditorStore.getState().select('a');
    useEditorStore.getState().cut('a');
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().cut('missing');
    const state = useEditorStore.getState();
    expect(state.clipboard).toBeNull();
    expect(state.instances).toEqual([baselineA, baselineB]);
  });
});

describe('paste', () => {
  it('is a no-op when the clipboard is empty', () => {
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    expect(state.instances).toEqual([baselineA, baselineB]);
    expect(state.nextInstanceId).toBe(2);
  });

  it('offsets the first paste from the clipboard snapshot', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'card',
      x: baselineA.x + 20,
      y: baselineA.y + 20,
    });
  });

  it('selects the pasted instance and tracks it as lastPasteId', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    const pastedId = state.instances.at(-1)?.id;
    expect(state.selectedId).toBe(pastedId);
    expect(state.lastPasteId).toBe(pastedId);
  });

  it('cascades subsequent pastes from the previously pasted instance', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    const second = state.instances.at(-1);
    // Two pastes → x/y offset by 2 × 20 from the clipboard snapshot.
    expect(second).toMatchObject({
      x: baselineA.x + 40,
      y: baselineA.y + 40,
    });
  });

  it('cascades from the last paste even after it has been moved', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    const firstPasteId = useEditorStore.getState().lastPasteId;
    if (!firstPasteId) throw new Error('expected lastPasteId to be set after paste');
    useEditorStore.getState().move(firstPasteId, { x: 500, y: 500 });
    useEditorStore.getState().paste();
    const second = useEditorStore.getState().instances.at(-1);
    expect(second).toMatchObject({ x: 520, y: 520 });
  });

  it('resets the cascade on copy so the first subsequent paste starts from the new snapshot', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    // Re-copy a different instance — cascade should reset to its snapshot.
    useEditorStore.getState().copy('b');
    useEditorStore.getState().paste();
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({ x: baselineB.x + 20, y: baselineB.y + 20 });
  });
});
