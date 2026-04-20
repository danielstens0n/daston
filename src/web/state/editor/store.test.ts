import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../editor.ts';
import { buildInstanceLayerForest, buildLayerTree, instanceSelection, layerSelection } from '../layers.ts';
import type { CardInstance, ImportedInstance, TextPrimitiveInstance } from '../types.ts';
import {
  baseCardBodyTextProps,
  baseCardTitleTextProps,
  createDefaultTextPrimitiveProps,
  layoutCardTextChildRects,
} from './instance-defaults.ts';
import { clipboardPayloadFromRoot, MIN_SIZE } from './mutations.ts';

// Reset the store to two cards with nested title/body text children before each test.

const baselineCardProps = {
  padding: 20,
  fill: '#ffffff',
  fillEnabled: true,
  borderColor: '#e4e4e7',
  borderWidth: 1,
  borderEnabled: true,
  borderRadius: 12,
  shadowEnabled: true,
  shadowColor: '#0000001a',
  shadowBlur: 12,
  shadowOffsetY: 4,
} as const satisfies CardInstance['props'];

const baselineA: CardInstance = {
  id: 'a',
  type: 'card',
  x: 10,
  y: 20,
  width: 280,
  height: 180,
  parentId: null,
  props: baselineCardProps,
};

const rectsA = layoutCardTextChildRects(baselineA);
const titleA: TextPrimitiveInstance = {
  id: 'a-title',
  type: 'text',
  parentId: 'a',
  ...rectsA.title,
  props: { ...baseCardTitleTextProps(), text: 'Card' },
};
const bodyA: TextPrimitiveInstance = {
  id: 'a-body',
  type: 'text',
  parentId: 'a',
  ...rectsA.body,
  props: { ...baseCardBodyTextProps(), text: 'Card body' },
};

const baselineB: CardInstance = { ...baselineA, id: 'b', x: 200, y: 200 };
const rectsB = layoutCardTextChildRects(baselineB);
const titleB: TextPrimitiveInstance = {
  id: 'b-title',
  type: 'text',
  parentId: 'b',
  ...rectsB.title,
  props: { ...baseCardTitleTextProps(), text: 'Card' },
};
const bodyB: TextPrimitiveInstance = {
  id: 'b-body',
  type: 'text',
  parentId: 'b',
  ...rectsB.body,
  props: { ...baseCardBodyTextProps(), text: 'Card body' },
};

const baselineInstances = [baselineA, titleA, bodyA, baselineB, titleB, bodyB] as const;

const importedBaseline: ImportedInstance = {
  id: 'imported-1',
  type: 'imported',
  definitionId: 'imported-def-9',
  x: 40,
  y: 50,
  width: 320,
  height: 220,
  parentId: null,
  props: {},
};

beforeEach(() => {
  useEditorStore.setState({
    instances: [...baselineInstances],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
    canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
    activeTool: 'select',
    pendingTextEditInstanceId: null,
  });
});

describe('shape instances', () => {
  it('addInstance creates a rectangle with default geometry and props', () => {
    useEditorStore.getState().addInstance('rectangle', { x: 200, y: 200 });
    const inst = useEditorStore.getState().instances.at(-1);
    expect(inst?.type).toBe('rectangle');
    if (inst?.type !== 'rectangle') return;
    expect(inst.props.fill).toBe('#e4e4e7');
    expect(inst.width).toBeGreaterThan(0);
    expect(inst.id).toMatch(/^rectangle-/);
  });

  it('addInstanceWithRect clamps width and height to MIN_SIZE', () => {
    useEditorStore.getState().addInstanceWithRect('ellipse', { x: 5, y: 5, width: 4, height: 3 });
    const inst = useEditorStore.getState().instances.at(-1);
    expect(inst?.width).toBe(MIN_SIZE);
    expect(inst?.height).toBe(MIN_SIZE);
  });
});

describe('select', () => {
  it('sets and clears selectedId', () => {
    useEditorStore.getState().select('a');
    expect(useEditorStore.getState().selectedId).toBe('a');
    useEditorStore.getState().select(null);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('tracks the selected instance target', () => {
    useEditorStore.getState().select('a');
    expect(useEditorStore.getState().selectedTarget).toEqual(instanceSelection('a'));
  });

  it('tracks a selected layer while keeping the owning instance selected', () => {
    const loneText: TextPrimitiveInstance = {
      id: 't1',
      type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      parentId: null,
      props: createDefaultTextPrimitiveProps(null),
    };
    useEditorStore.setState({ instances: [loneText], nextInstanceId: 2 });
    useEditorStore.getState().selectLayer(layerSelection('t1', 'text'));
    expect(useEditorStore.getState().selectedId).toBe('t1');
    expect(useEditorStore.getState().selectedTarget).toEqual(layerSelection('t1', 'text'));
  });
});

describe('layer tree projection', () => {
  it('card root has no template sub-layers (title/body are real instances)', () => {
    const tree = buildLayerTree(baselineA);
    expect(tree).toMatchObject({
      instanceId: 'a',
      label: 'Card',
      selection: { kind: 'instance', instanceId: 'a' },
    });
    expect(tree.children).toEqual([]);
  });

  it('forest nests card text children under the card root', () => {
    const forest = buildInstanceLayerForest([...baselineInstances]);
    const cardNode = forest.find((n) => n.instanceId === 'a');
    expect(cardNode?.children.some((c) => c.instanceId === 'a-title')).toBe(true);
    expect(cardNode?.children.some((c) => c.instanceId === 'a-body')).toBe(true);
  });

  it('keeps imported components as opaque leaves', () => {
    useEditorStore.setState({ instances: [importedBaseline], selectedTarget: null });
    const tree = useEditorStore.getState().instances.map((instance) => buildLayerTree(instance));
    expect(tree[0]).toMatchObject({
      instanceId: 'imported-1',
      label: 'Imported',
      secondaryLabel: 'imported-def-9 · imported-1',
      children: [],
    });
  });
});

describe('move', () => {
  it('updates only the matching instance position', () => {
    useEditorStore.getState().move('a', { x: 111, y: 222 });
    const { instances } = useEditorStore.getState();
    expect(instances.find((i) => i.id === 'a')).toMatchObject({ id: 'a', x: 111, y: 222 });
    expect(instances.find((i) => i.id === 'a-title')).toMatchObject({
      x: rectsA.title.x + 101,
      y: rectsA.title.y + 202,
    });
    expect(instances.find((i) => i.id === 'b')).toEqual(baselineB);
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
    expect(useEditorStore.getState().instances.find((i) => i.id === 'b')).toEqual(baselineB);
  });

  it('leaves props untouched', () => {
    useEditorStore.getState().resize('a', { x: 0, y: 0, width: 100, height: 100 });
    expect(useEditorStore.getState().instances[0]?.props).toEqual(baselineA.props);
  });
});

describe('addInstance', () => {
  it('centers a new card at the given world point', () => {
    useEditorStore.getState().addInstance('card', { x: 500, y: 400 });
    const roots = useEditorStore.getState().instances.filter((i) => i.type === 'card');
    const added = roots.at(-1);
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
    const newRoot = state.instances.filter((i) => i.type === 'card').at(-1);
    expect(state.selectedId).toBe(newRoot?.id);
  });

  it('assigns a unique id on each call', () => {
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    const state = useEditorStore.getState();
    const ids = state.instances.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(state.nextInstanceId).toBe(8);
  });

  it('centers a new button at the given world point', () => {
    useEditorStore.getState().addInstance('button', { x: 100, y: 80 });
    const roots = useEditorStore.getState().instances.filter((i) => i.type === 'button');
    const added = roots.at(-1);
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
    const updated = useEditorStore.getState().instances.find((i) => i.id === 'a');
    expect(updated?.props).toMatchObject({
      ...baselineA.props,
      fill: '#ff0000',
      borderRadius: 8,
    });
  });

  it('does not affect other instances', () => {
    useEditorStore.getState().updateProps('a', { fill: '#ff0000' });
    expect(useEditorStore.getState().instances.find((i) => i.id === 'b')).toEqual(baselineB);
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().updateProps('missing', { fill: '#ff0000' });
    expect(useEditorStore.getState().instances).toEqual([...baselineInstances]);
  });
});

describe('remove', () => {
  it('drops the matching instance and leaves others alone', () => {
    useEditorStore.getState().remove('a');
    const { instances } = useEditorStore.getState();
    expect(instances).toEqual([baselineB, titleB, bodyB]);
  });

  it('clears selectedId when it matches the removed id', () => {
    useEditorStore.getState().select('a');
    useEditorStore.getState().remove('a');
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it('clears selectedTarget when removing the owning instance', () => {
    useEditorStore.getState().selectLayer(layerSelection('a-body', 'text'));
    useEditorStore.getState().remove('a');
    expect(useEditorStore.getState().selectedTarget).toBeNull();
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
    expect(useEditorStore.getState().instances).toEqual([...baselineInstances]);
  });
});

describe('duplicate', () => {
  it('clones the subtree with +20 offset on every instance x and y', () => {
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    const root = state.instances.find((i) => i.id === state.selectedId);
    expect(root).toMatchObject({
      type: 'card',
      x: baselineA.x + 20,
      y: baselineA.y + 20,
      width: baselineA.width,
      height: baselineA.height,
      props: baselineA.props,
    });
    const children = state.instances.filter((i) => i.parentId === root?.id);
    expect(children).toHaveLength(2);
    expect(children.every((c) => c.type === 'text')).toBe(true);
    expect(children[0]?.x).toBe(titleA.x + 20);
    expect(children[0]?.y).toBe(titleA.y + 20);
  });

  it('assigns fresh ids and bumps the counter by subtree size', () => {
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe('card-2');
    expect(state.nextInstanceId).toBe(5);
  });

  it('selects the new root instance', () => {
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe('card-2');
    expect(state.instances.find((i) => i.id === 'card-2')?.type).toBe('card');
  });

  it('does not touch clipboard or lastPasteId', () => {
    const clip = { instances: [baselineB] };
    useEditorStore.setState({ clipboard: clip, lastPasteId: 'b' });
    useEditorStore.getState().duplicate('a');
    const state = useEditorStore.getState();
    expect(state.clipboard).toBe(clip);
    expect(state.lastPasteId).toBe('b');
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().duplicate('missing');
    const state = useEditorStore.getState();
    expect(state.instances).toEqual([...baselineInstances]);
    expect(state.nextInstanceId).toBe(2);
  });

  it('preserves definitionId when duplicating an imported component', () => {
    useEditorStore.setState({
      instances: [baselineA, importedBaseline],
      selectedId: null,
      selectedTarget: null,
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
  it('clones the subtree at the same x and y as the source', () => {
    const id = useEditorStore.getState().duplicateInPlaceForDrag('a');
    expect(id).toBe('card-2');
    const root = useEditorStore.getState().instances.find((i) => i.id === 'card-2');
    expect(root).toMatchObject({
      id: 'card-2',
      type: 'card',
      x: baselineA.x,
      y: baselineA.y,
      width: baselineA.width,
      height: baselineA.height,
      props: baselineA.props,
    });
    const texts = useEditorStore
      .getState()
      .instances.filter((i) => i.parentId === 'card-2' && i.type === 'text');
    expect(texts).toHaveLength(2);
    expect(texts.some((t) => t.x === titleA.x && t.y === titleA.y)).toBe(true);
  });

  it('returns null and leaves state unchanged when the id is unknown', () => {
    const id = useEditorStore.getState().duplicateInPlaceForDrag('missing');
    expect(id).toBeNull();
    expect(useEditorStore.getState().instances).toEqual([...baselineInstances]);
    expect(useEditorStore.getState().nextInstanceId).toBe(2);
  });

  it('selects the clone and bumps nextInstanceId by subtree size', () => {
    useEditorStore.getState().duplicateInPlaceForDrag('a');
    const state = useEditorStore.getState();
    expect(state.selectedId).toBe('card-2');
    expect(state.nextInstanceId).toBe(5);
  });

  it('does not touch clipboard or lastPasteId', () => {
    const clip = { instances: [baselineB] };
    useEditorStore.setState({ clipboard: clip, lastPasteId: 'b' });
    useEditorStore.getState().duplicateInPlaceForDrag('a');
    const state = useEditorStore.getState();
    expect(state.clipboard).toBe(clip);
    expect(state.lastPasteId).toBe('b');
  });
});

describe('copy', () => {
  it('stores the full subtree in clipboard', () => {
    useEditorStore.getState().copy('a');
    expect(useEditorStore.getState().clipboard).toEqual(
      clipboardPayloadFromRoot([...baselineInstances], 'a'),
    );
  });

  it('resets lastPasteId so the next paste starts fresh', () => {
    useEditorStore.setState({ lastPasteId: 'b' });
    useEditorStore.getState().copy('a');
    expect(useEditorStore.getState().lastPasteId).toBeNull();
  });

  it('does not mutate instances', () => {
    useEditorStore.getState().copy('a');
    expect(useEditorStore.getState().instances).toEqual([...baselineInstances]);
  });

  it('is a no-op when the id is unknown', () => {
    useEditorStore.getState().copy('missing');
    expect(useEditorStore.getState().clipboard).toBeNull();
  });
});

describe('cut', () => {
  it('stores the subtree snapshot and removes the source', () => {
    useEditorStore.getState().cut('a');
    const state = useEditorStore.getState();
    expect(state.clipboard).toEqual(clipboardPayloadFromRoot([...baselineInstances], 'a'));
    expect(state.instances).toEqual([baselineB, titleB, bodyB]);
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
    expect(state.instances).toEqual([...baselineInstances]);
  });

  it('restores instances and clears clipboard on undo, then reapplies cut on redo', () => {
    useEditorStore.getState().cut('a');
    expect(useEditorStore.getState().instances).toEqual([baselineB, titleB, bodyB]);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().instances).toEqual([...baselineInstances]);
    expect(useEditorStore.getState().clipboard).toBeNull();

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().instances).toEqual([baselineB, titleB, bodyB]);
    expect(useEditorStore.getState().clipboard).toEqual(
      clipboardPayloadFromRoot([...baselineInstances], 'a'),
    );
  });
});

describe('paste', () => {
  it('is a no-op when the clipboard is empty', () => {
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    expect(state.instances).toEqual([...baselineInstances]);
    expect(state.nextInstanceId).toBe(2);
  });

  it('offsets the first paste from the clipboard snapshot', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    const root = state.instances.find((i) => i.id === state.selectedId);
    expect(root).toMatchObject({
      type: 'card',
      x: baselineA.x + 20,
      y: baselineA.y + 20,
    });
  });

  it('selects the pasted root and tracks it as lastPasteId', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    const root = state.instances.find((i) => i.id === state.selectedId);
    expect(root?.type).toBe('card');
    expect(state.lastPasteId).toBe(state.selectedId);
  });

  it('cascades subsequent pastes from the previously pasted instance', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    useEditorStore.getState().paste();
    const state = useEditorStore.getState();
    const secondRoot = state.instances.find((i) => i.id === state.selectedId);
    // Two pastes → root x/y offset by 2 × 20 from the clipboard snapshot.
    expect(secondRoot).toMatchObject({
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
    const secondRoot = useEditorStore
      .getState()
      .instances.find((i) => i.id === useEditorStore.getState().selectedId);
    expect(secondRoot).toMatchObject({ x: 520, y: 520 });
  });

  it('resets the cascade on copy so the first subsequent paste starts from the new snapshot', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste();
    // Re-copy a different instance — cascade should reset to its snapshot.
    useEditorStore.getState().copy('b');
    useEditorStore.getState().paste();
    const root = useEditorStore
      .getState()
      .instances.find((i) => i.id === useEditorStore.getState().selectedId);
    expect(root).toMatchObject({ x: baselineB.x + 20, y: baselineB.y + 20 });
  });

  it('preserves definitionId when pasting an imported component', () => {
    useEditorStore.setState({
      instances: [baselineA, importedBaseline],
      selectedId: null,
      selectedTarget: null,
      nextInstanceId: 2,
      clipboard: null,
      lastPasteId: null,
      past: [],
      future: [],
      historyBatch: null,
    });
    useEditorStore.getState().copy('imported-1');
    useEditorStore.getState().paste();
    const root = useEditorStore
      .getState()
      .instances.find((i) => i.id === useEditorStore.getState().selectedId);
    expect(root).toMatchObject({
      type: 'imported',
      definitionId: 'imported-def-9',
      x: importedBaseline.x + 20,
      y: importedBaseline.y + 20,
    });
  });

  it('centers the pasted clone on `at` when provided', () => {
    useEditorStore.getState().copy('a');
    useEditorStore.getState().paste({ at: { x: 500, y: 400 } });
    const root = useEditorStore
      .getState()
      .instances.find((i) => i.id === useEditorStore.getState().selectedId);
    expect(root).toMatchObject({
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
    const secondRoot = useEditorStore
      .getState()
      .instances.find((i) => i.id === useEditorStore.getState().selectedId);
    const first = useEditorStore.getState().instances.find((i) => i.id === firstId);
    expect(first).toBeDefined();
    expect(secondRoot).toMatchObject({
      x: (first?.x ?? 0) + 20,
      y: (first?.y ?? 0) + 20,
    });
  });
});

describe('parent/child hierarchy', () => {
  it('setParent rejects self-parenting, cycles, and unknown parents', () => {
    useEditorStore.setState({
      instances: [
        { ...baselineA, parentId: null },
        { ...baselineB, parentId: 'a' },
      ],
    });
    useEditorStore.getState().setParent('a', 'a');
    expect(useEditorStore.getState().instances[0]?.parentId).toBe(null);
    useEditorStore.getState().setParent('a', 'b');
    expect(useEditorStore.getState().instances[0]?.parentId).toBe(null);
    useEditorStore.getState().setParent('b', 'missing');
    expect(useEditorStore.getState().instances[1]?.parentId).toBe('a');
  });

  it('move cascades the delta to every descendant', () => {
    useEditorStore.setState({
      instances: [
        { ...baselineA, x: 0, y: 0, parentId: null },
        { ...baselineB, x: 10, y: 10, parentId: 'a' },
      ],
    });
    useEditorStore.getState().move('a', { x: 100, y: 50 });
    const [parent, child] = useEditorStore.getState().instances;
    expect(parent).toMatchObject({ id: 'a', x: 100, y: 50 });
    expect(child).toMatchObject({ id: 'b', x: 110, y: 60 });
  });

  it('remove drops the whole subtree in one step', () => {
    useEditorStore.setState({
      instances: [
        { ...baselineA, parentId: null },
        { ...baselineB, parentId: 'a' },
      ],
    });
    useEditorStore.getState().remove('a');
    expect(useEditorStore.getState().instances).toHaveLength(0);
  });

  it('paste always produces a root clone even when the clipboard carried a parent', () => {
    useEditorStore.setState({
      instances: [baselineA, { ...baselineB, parentId: 'a' }],
      clipboard: { instances: [{ ...baselineB, parentId: 'a' }] },
      lastPasteId: null,
    });
    useEditorStore.getState().paste();
    const pastedRoot = useEditorStore
      .getState()
      .instances.find((i) => i.id === useEditorStore.getState().selectedId);
    expect(pastedRoot?.parentId).toBe(null);
  });
});

describe('reorderInstance', () => {
  const c: CardInstance = { ...baselineA, id: 'c' };

  it('moves an instance before another sibling in the flat array', () => {
    useEditorStore.setState({ instances: [baselineA, baselineB, c] });
    useEditorStore.getState().reorderInstance('c', { parentId: null, beforeId: 'a' });
    expect(useEditorStore.getState().instances.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('appends as last sibling when beforeId is null', () => {
    useEditorStore.setState({ instances: [baselineA, baselineB, c] });
    useEditorStore.getState().reorderInstance('a', { parentId: null, beforeId: null });
    expect(useEditorStore.getState().instances.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('reparents into another instance while updating parentId', () => {
    useEditorStore.setState({ instances: [baselineA, baselineB] });
    useEditorStore.getState().reorderInstance('b', { parentId: 'a', beforeId: null });
    const [, child] = useEditorStore.getState().instances;
    expect(child?.id).toBe('b');
    expect(child?.parentId).toBe('a');
  });

  it('rejects cycles (reparent under own descendant)', () => {
    useEditorStore.setState({
      instances: [
        { ...baselineA, parentId: null },
        { ...baselineB, parentId: 'a' },
      ],
    });
    useEditorStore.getState().reorderInstance('a', { parentId: 'b', beforeId: null });
    expect(useEditorStore.getState().instances[0]?.parentId).toBe(null);
  });

  it('rejects when beforeId does not share the target parent', () => {
    useEditorStore.setState({
      instances: [
        { ...baselineA, parentId: null },
        { ...baselineB, parentId: 'a' },
        { ...c, parentId: null },
      ],
    });
    useEditorStore.getState().reorderInstance('c', { parentId: null, beforeId: 'b' });
    expect(useEditorStore.getState().instances.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('undo/redo', () => {
  it('undoes and redoes addInstance', () => {
    useEditorStore.getState().addInstance('card', { x: 400, y: 300 });
    expect(useEditorStore.getState().instances).toHaveLength(9);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().instances).toEqual([...baselineInstances]);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().instances).toHaveLength(9);
    const newCard = useEditorStore.getState().instances.find((i) => i.id === 'card-2' && i.type === 'card');
    expect(newCard).toMatchObject({ id: 'card-2', type: 'card' });
  });

  it('clears redo history when a new mutation happens after undo', () => {
    useEditorStore.setState({
      instances: [baselineA, baselineB],
      nextInstanceId: 2,
      past: [],
      future: [],
      historyBatch: null,
    });
    useEditorStore.getState().duplicate('a');
    useEditorStore.getState().undo();
    useEditorStore.getState().move('b', { x: 250, y: 260 });
    useEditorStore.getState().redo();

    expect(useEditorStore.getState().instances).toEqual([baselineA, { ...baselineB, x: 250, y: 260 }]);
  });
});
