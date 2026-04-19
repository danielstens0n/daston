import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editor.ts';
import type { CardInstance, ImportedInstance } from './types.ts';

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
    title: 'Card',
    body: 'Card body',
    titleColor: '#18181b',
    bodyColor: '#52525b',
    titleFont: 'inter',
    bodyFont: 'inter',
  },
};

const baselineB: CardInstance = { ...baselineA, id: 'b', x: 200, y: 200 };
const importedBaseline: ImportedInstance = {
  id: 'imported-1',
  type: 'imported',
  definitionId: 'imported-def-9',
  x: 40,
  y: 50,
  width: 320,
  height: 220,
  props: {},
};

beforeEach(() => {
  useEditorStore.setState({
    instances: [baselineA, baselineB],
    selectedId: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
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

  it('coalesces a batched drag into one undo step', () => {
    const store = useEditorStore.getState();
    store.beginHistoryBatch();
    store.move('a', { x: 30, y: 40 });
    store.move('a', { x: 50, y: 60 });
    store.endHistoryBatch();

    expect(useEditorStore.getState().instances[0]).toMatchObject({ id: 'a', x: 50, y: 60 });

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().instances[0]).toMatchObject({ id: 'a', x: 10, y: 20 });

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().instances[0]).toMatchObject({ id: 'a', x: 50, y: 60 });
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

describe('addImportedInstance', () => {
  it('centers a new imported component at the given world point', () => {
    useEditorStore.getState().addImportedInstance('imported-def-1', { x: 400, y: 300 });
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'imported',
      definitionId: 'imported-def-1',
      x: 400 - 320 / 2,
      y: 300 - 220 / 2,
      width: 320,
      height: 220,
    });
  });

  it('selects the new imported instance and bumps the counter', () => {
    useEditorStore.getState().addImportedInstance('imported-def-2', { x: 0, y: 0 });
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe(state.instances.at(-1)?.id);
    expect(state.nextInstanceId).toBe(3);
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

  it('preserves definitionId when duplicating an imported component', () => {
    useEditorStore.setState({
      instances: [baselineA, importedBaseline],
      selectedId: null,
      nextInstanceId: 2,
      clipboard: null,
      lastPasteId: null,
    });
    useEditorStore.getState().duplicate('imported-1');
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'imported',
      definitionId: 'imported-def-9',
      x: importedBaseline.x + 20,
      y: importedBaseline.y + 20,
    });
  });
});

describe('duplicateInPlaceForDrag', () => {
  it('clones at the same x and y as the source', () => {
    const id = useEditorStore.getState().duplicateInPlaceForDrag('a');
    expect(id).toBe('card-2');
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      id: 'card-2',
      type: 'card',
      x: baselineA.x,
      y: baselineA.y,
      width: baselineA.width,
      height: baselineA.height,
      props: baselineA.props,
    });
  });

  it('returns null and leaves state unchanged when the id is unknown', () => {
    const id = useEditorStore.getState().duplicateInPlaceForDrag('missing');
    expect(id).toBeNull();
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
    expect(useEditorStore.getState().nextInstanceId).toBe(2);
  });

  it('selects the clone and bumps nextInstanceId', () => {
    useEditorStore.getState().duplicateInPlaceForDrag('a');
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe('card-2');
    expect(state.nextInstanceId).toBe(3);
  });

  it('does not touch clipboard or lastPasteId', () => {
    useEditorStore.setState({ clipboard: baselineB, lastPasteId: 'b' });
    useEditorStore.getState().duplicateInPlaceForDrag('a');
    const state = useEditorStore.getState();
    expect(state.clipboard).toBe(baselineB);
    expect(state.lastPasteId).toBe('b');
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

  it('restores the canvas and clipboard on undo, then reapplies on redo', () => {
    useEditorStore.getState().cut('a');
    expect(useEditorStore.getState().instances).toEqual([baselineB]);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
    expect(useEditorStore.getState().clipboard).toBeNull();

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().instances).toEqual([baselineB]);
    expect(useEditorStore.getState().clipboard).toEqual(baselineA);
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

  it('preserves definitionId when pasting an imported component', () => {
    useEditorStore.setState({
      instances: [baselineA, importedBaseline],
      selectedId: null,
      nextInstanceId: 2,
      clipboard: null,
      lastPasteId: null,
      past: [],
      future: [],
      historyBatch: null,
    });
    useEditorStore.getState().copy('imported-1');
    useEditorStore.getState().paste();
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'imported',
      definitionId: 'imported-def-9',
      x: importedBaseline.x + 20,
      y: importedBaseline.y + 20,
    });
  });

  it('centers the pasted clone on `at` when provided', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste({ at: { x: 500, y: 400 } });
    const added = useEditorStore.getState().instances.at(-1);
    expect(added).toMatchObject({
      type: 'card',
      x: 500 - baselineA.width / 2,
      y: 400 - baselineA.height / 2,
      width: baselineA.width,
      height: baselineA.height,
    });
  });

  it('sets lastPasteId after paste with `at` so the next paste cascades from the new instance', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste({ at: { x: 1000, y: 1000 } });
    const firstId = useEditorStore.getState().lastPasteId;
    useEditorStore.getState().paste();
    const second = useEditorStore.getState().instances.at(-1);
    const first = useEditorStore.getState().instances.find((i) => i.id === firstId);
    expect(first).toBeDefined();
    expect(second).toMatchObject({
      x: (first?.x ?? 0) + 20,
      y: (first?.y ?? 0) + 20,
    });
  });
});

describe('undo/redo', () => {
  it('undoes and redoes addInstance', () => {
    useEditorStore.getState().addInstance('card', { x: 400, y: 300 });
    expect(useEditorStore.getState().instances).toHaveLength(3);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().instances).toHaveLength(3);
    expect(useEditorStore.getState().instances.at(-1)).toMatchObject({ id: 'card-2', type: 'card' });
  });

  it('clears redo history when a new mutation happens after undo', () => {
    useEditorStore.getState().duplicate('a');
    useEditorStore.getState().undo();
    useEditorStore.getState().move('b', { x: 250, y: 260 });
    useEditorStore.getState().redo();

    expect(useEditorStore.getState().instances).toEqual([baselineA, { ...baselineB, x: 250, y: 260 }]);
  });
});
