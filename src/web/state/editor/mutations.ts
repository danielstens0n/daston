import type { ComponentId } from '../../../shared/types.ts';
import { collectDescendantIds, collectSubtreeIds, orderedSubtreeInstances } from '../hierarchy.ts';
import { instanceSelection, layerSelection } from '../layers.ts';
import type { ButtonInstance, CardInstance, ComponentInstance, TextPrimitiveInstance } from '../types.ts';
import type { EditorClipboard, EditorSnapshot } from './history.ts';
import {
  createDefaultButtonLabelTextProps,
  createDefaultButtonProps,
  createDefaultCardBodyTextProps,
  createDefaultCardProps,
  createDefaultCardTitleTextProps,
  createDefaultLandingProps,
  createDefaultShapeProps,
  createDefaultTableProps,
  createDefaultTextPrimitiveProps,
  DEFAULT_BUTTON_HEIGHT,
  DEFAULT_BUTTON_WIDTH,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_CARD_WIDTH,
  DEFAULT_IMPORTED_HEIGHT,
  DEFAULT_IMPORTED_WIDTH,
  DEFAULT_LANDING_HEIGHT,
  DEFAULT_LANDING_WIDTH,
  DEFAULT_SHAPE_HEIGHT,
  DEFAULT_SHAPE_WIDTH,
  DEFAULT_TABLE_HEIGHT,
  DEFAULT_TABLE_WIDTH,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_WIDTH,
  layoutButtonLabelRect,
  layoutCardTextChildRects,
} from './instance-defaults.ts';

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type BaseGeometry = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
};

export const MIN_SIZE = 40;
export const PASTE_OFFSET = 20;

/** Deep snapshot of `rootId` and descendants for copy/cut (root is normalized to `parentId: null`). */
export function clipboardPayloadFromRoot(
  instances: readonly ComponentInstance[],
  rootId: string,
): EditorClipboard {
  const ordered = orderedSubtreeInstances(instances, rootId);
  const out = structuredClone(ordered) as ComponentInstance[];
  if (out[0]) {
    out[0] = { ...out[0], parentId: null } as ComponentInstance;
  }
  return { instances: out };
}

function cloneSubtreePatch(
  state: EditorSnapshot,
  rootId: string,
  offset: { x: number; y: number },
): Partial<EditorSnapshot> | null {
  const ordered = orderedSubtreeInstances(state.instances, rootId);
  if (ordered.length === 0) return null;
  let next = state.nextInstanceId;
  const idMap = new Map<string, string>();
  for (const inst of ordered) {
    idMap.set(inst.id, `${inst.type}-${next}`);
    next += 1;
  }
  const clones: ComponentInstance[] = ordered.map((inst) => {
    const newId = idMap.get(inst.id);
    if (!newId) return inst;
    const mappedParent = inst.parentId === null ? null : (idMap.get(inst.parentId) ?? null);
    return {
      ...inst,
      id: newId,
      parentId: mappedParent,
      x: inst.x + offset.x,
      y: inst.y + offset.y,
    } as ComponentInstance;
  });
  const newRootId = clones[0]?.id;
  if (!newRootId) return null;
  return {
    instances: [...state.instances, ...clones],
    selectedId: newRootId,
    selectedTarget: instanceSelection(newRootId),
    nextInstanceId: next,
  };
}

function shapeFactory(type: 'rectangle' | 'ellipse' | 'triangle') {
  return {
    width: DEFAULT_SHAPE_WIDTH,
    height: DEFAULT_SHAPE_HEIGHT,
    build: (base: BaseGeometry): ComponentInstance => ({
      ...base,
      type,
      props: createDefaultShapeProps(),
    }),
  };
}

function buildCardInstances(state: EditorSnapshot, base: BaseGeometry): ComponentInstance[] {
  const n = state.nextInstanceId;
  const root: CardInstance = {
    ...base,
    type: 'card',
    props: createDefaultCardProps(),
  };
  const rects = layoutCardTextChildRects(root);
  const title: TextPrimitiveInstance = {
    id: `text-${n + 1}`,
    type: 'text',
    parentId: root.id,
    ...rects.title,
    props: createDefaultCardTitleTextProps(),
  };
  const body: TextPrimitiveInstance = {
    id: `text-${n + 2}`,
    type: 'text',
    parentId: root.id,
    ...rects.body,
    props: createDefaultCardBodyTextProps(),
  };
  return [root, title, body];
}

function buildButtonInstances(state: EditorSnapshot, base: BaseGeometry): ComponentInstance[] {
  const n = state.nextInstanceId;
  const root: ButtonInstance = {
    ...base,
    type: 'button',
    props: createDefaultButtonProps(),
  };
  const labelRect = layoutButtonLabelRect(root);
  const label: TextPrimitiveInstance = {
    id: `text-${n + 1}`,
    type: 'text',
    parentId: root.id,
    ...labelRect,
    props: createDefaultButtonLabelTextProps(),
  };
  return [root, label];
}

const STOCK_INSTANCE_FACTORIES = {
  table: {
    width: DEFAULT_TABLE_WIDTH,
    height: DEFAULT_TABLE_HEIGHT,
    build: (base: BaseGeometry): ComponentInstance => ({
      ...base,
      type: 'table',
      props: createDefaultTableProps(),
    }),
  },
  landing: {
    width: DEFAULT_LANDING_WIDTH,
    height: DEFAULT_LANDING_HEIGHT,
    build: (base: BaseGeometry): ComponentInstance => ({
      ...base,
      type: 'landing',
      props: createDefaultLandingProps(),
    }),
  },
  rectangle: shapeFactory('rectangle'),
  ellipse: shapeFactory('ellipse'),
  triangle: shapeFactory('triangle'),
  text: {
    width: DEFAULT_TEXT_WIDTH,
    height: DEFAULT_TEXT_HEIGHT,
    build: (base: BaseGeometry): ComponentInstance => ({
      ...base,
      type: 'text',
      props: createDefaultTextPrimitiveProps(),
    }),
  },
} as const satisfies Record<
  Exclude<ComponentId, 'card' | 'button'>,
  { width: number; height: number; build: (base: BaseGeometry) => ComponentInstance }
>;

function commitNewInstance(state: EditorSnapshot, instance: ComponentInstance): Partial<EditorSnapshot> {
  return {
    instances: [...state.instances, instance],
    selectedId: instance.id,
    selectedTarget: instanceSelection(instance.id),
    nextInstanceId: state.nextInstanceId + 1,
  };
}

function commitNewInstanceTree(
  state: EditorSnapshot,
  instances: ComponentInstance[],
): Partial<EditorSnapshot> {
  const root = instances[0];
  if (!root) return {};
  return {
    instances: [...state.instances, ...instances],
    selectedId: root.id,
    selectedTarget: instanceSelection(root.id),
    nextInstanceId: state.nextInstanceId + instances.length,
  };
}

export function mutationMove(state: EditorSnapshot, id: string, pos: Point): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) return null;
  if (instance.x === pos.x && instance.y === pos.y) return null;
  const dx = pos.x - instance.x;
  const dy = pos.y - instance.y;
  const descendants = collectDescendantIds(state.instances, id);
  return {
    instances: state.instances.map((candidate) => {
      if (candidate.id === id) return { ...candidate, x: pos.x, y: pos.y };
      if (descendants.has(candidate.id)) {
        return { ...candidate, x: candidate.x + dx, y: candidate.y + dy };
      }
      return candidate;
    }),
  };
}

export function mutationResize(
  state: EditorSnapshot,
  id: string,
  rect: Rect,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) return null;
  const width = Math.max(MIN_SIZE, rect.width);
  const height = Math.max(MIN_SIZE, rect.height);
  if (
    instance.x === rect.x &&
    instance.y === rect.y &&
    instance.width === width &&
    instance.height === height
  ) {
    return null;
  }
  return {
    instances: state.instances.map((candidate) =>
      candidate.id === id ? { ...candidate, x: rect.x, y: rect.y, width, height } : candidate,
    ),
  };
}

export function mutationAddInstance(
  state: EditorSnapshot,
  type: ComponentId,
  worldCenter: Point,
): Partial<EditorSnapshot> {
  if (type === 'card') {
    const base: BaseGeometry = {
      id: `card-${state.nextInstanceId}`,
      x: worldCenter.x - DEFAULT_CARD_WIDTH / 2,
      y: worldCenter.y - DEFAULT_CARD_HEIGHT / 2,
      width: DEFAULT_CARD_WIDTH,
      height: DEFAULT_CARD_HEIGHT,
      parentId: null,
    };
    return commitNewInstanceTree(state, buildCardInstances(state, base));
  }
  if (type === 'button') {
    const base: BaseGeometry = {
      id: `button-${state.nextInstanceId}`,
      x: worldCenter.x - DEFAULT_BUTTON_WIDTH / 2,
      y: worldCenter.y - DEFAULT_BUTTON_HEIGHT / 2,
      width: DEFAULT_BUTTON_WIDTH,
      height: DEFAULT_BUTTON_HEIGHT,
      parentId: null,
    };
    return commitNewInstanceTree(state, buildButtonInstances(state, base));
  }
  const factory = STOCK_INSTANCE_FACTORIES[type];
  const instance = factory.build({
    id: `${type}-${state.nextInstanceId}`,
    x: worldCenter.x - factory.width / 2,
    y: worldCenter.y - factory.height / 2,
    width: factory.width,
    height: factory.height,
    parentId: null,
  });
  return commitNewInstance(state, instance);
}

export function mutationAddInstanceWithRect(
  state: EditorSnapshot,
  type: ComponentId,
  rect: Rect,
): Partial<EditorSnapshot> {
  const width = Math.max(MIN_SIZE, rect.width);
  const height = Math.max(MIN_SIZE, rect.height);
  if (type === 'card') {
    const base: BaseGeometry = {
      id: `card-${state.nextInstanceId}`,
      x: rect.x,
      y: rect.y,
      width,
      height,
      parentId: null,
    };
    return commitNewInstanceTree(state, buildCardInstances(state, base));
  }
  if (type === 'button') {
    const base: BaseGeometry = {
      id: `button-${state.nextInstanceId}`,
      x: rect.x,
      y: rect.y,
      width,
      height,
      parentId: null,
    };
    return commitNewInstanceTree(state, buildButtonInstances(state, base));
  }
  const factory = STOCK_INSTANCE_FACTORIES[type];
  const instance = factory.build({
    id: `${type}-${state.nextInstanceId}`,
    x: rect.x,
    y: rect.y,
    width,
    height,
    parentId: null,
  });
  return commitNewInstance(state, instance);
}

export function mutationAddImportedInstance(
  state: EditorSnapshot,
  definitionId: string,
  worldCenter: Point,
): Partial<EditorSnapshot> {
  const instance: ComponentInstance = {
    id: `imported-${state.nextInstanceId}`,
    type: 'imported',
    definitionId,
    x: worldCenter.x - DEFAULT_IMPORTED_WIDTH / 2,
    y: worldCenter.y - DEFAULT_IMPORTED_HEIGHT / 2,
    width: DEFAULT_IMPORTED_WIDTH,
    height: DEFAULT_IMPORTED_HEIGHT,
    parentId: null,
    props: {},
  };
  return commitNewInstance(state, instance);
}

export function mutationUpdateProps(
  state: EditorSnapshot,
  id: string,
  patch: Record<string, unknown>,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) return null;
  if (
    Object.entries(patch).every(([key, value]) =>
      Object.is(instance.props[key as keyof typeof instance.props], value),
    )
  ) {
    return null;
  }
  const nextProps = { ...instance.props, ...patch };
  return {
    instances: state.instances.map((candidate) =>
      candidate.id === id ? ({ ...candidate, props: nextProps } as ComponentInstance) : candidate,
    ),
  };
}

// Drop every instance in `subtree` and null out selection/paste cursors that
// pointed into it. Shared by remove/cut so they stay in sync as new
// selection-related fields appear.
function removeSubtreePatch(
  state: EditorSnapshot,
  subtree: Set<string>,
): Pick<EditorSnapshot, 'instances' | 'selectedId' | 'selectedTarget' | 'lastPasteId'> {
  return {
    instances: state.instances.filter((instance) => !subtree.has(instance.id)),
    selectedId: state.selectedId && subtree.has(state.selectedId) ? null : state.selectedId,
    selectedTarget:
      state.selectedTarget && subtree.has(state.selectedTarget.instanceId) ? null : state.selectedTarget,
    lastPasteId: state.lastPasteId && subtree.has(state.lastPasteId) ? null : state.lastPasteId,
  };
}

export function mutationRemove(state: EditorSnapshot, id: string): Partial<EditorSnapshot> | null {
  if (!state.instances.some((instance) => instance.id === id)) return null;
  return removeSubtreePatch(state, collectSubtreeIds(state.instances, id));
}

export function mutationDuplicate(state: EditorSnapshot, id: string): Partial<EditorSnapshot> | null {
  if (!state.instances.some((instance) => instance.id === id)) return null;
  return cloneSubtreePatch(state, id, { x: PASTE_OFFSET, y: PASTE_OFFSET });
}

export function mutationDuplicateInPlaceForDrag(
  state: EditorSnapshot,
  id: string,
): { patch: Partial<EditorSnapshot>; createdId: string } | null {
  const patch = cloneSubtreePatch(state, id, { x: 0, y: 0 });
  if (!patch?.selectedId) return null;
  return { createdId: patch.selectedId, patch };
}

export function mutationCut(state: EditorSnapshot, id: string): Partial<EditorSnapshot> | null {
  if (!state.instances.some((instance) => instance.id === id)) return null;
  return {
    ...removeSubtreePatch(state, collectSubtreeIds(state.instances, id)),
    clipboard: clipboardPayloadFromRoot(state.instances, id),
    lastPasteId: null,
  };
}

export function mutationPaste(
  state: EditorSnapshot,
  options?: { at?: Point },
): Partial<EditorSnapshot> | null {
  const { clipboard } = state;
  if (!clipboard?.instances.length) return null;
  const source = clipboard.instances;
  const clipRoot = source[0];
  if (!clipRoot) return null;
  let next = state.nextInstanceId;
  const idMap = new Map<string, string>();
  for (const inst of source) {
    idMap.set(inst.id, `${inst.type}-${next}`);
    next += 1;
  }
  let dx: number;
  let dy: number;
  if (options?.at !== undefined) {
    dx = options.at.x - clipRoot.width / 2 - clipRoot.x;
    dy = options.at.y - clipRoot.height / 2 - clipRoot.y;
  } else {
    const lastPasted = state.lastPasteId
      ? (state.instances.find((instance) => instance.id === state.lastPasteId) ?? null)
      : null;
    const base = lastPasted ?? clipRoot;
    dx = base.x + PASTE_OFFSET - clipRoot.x;
    dy = base.y + PASTE_OFFSET - clipRoot.y;
  }
  const clones: ComponentInstance[] = source.map((inst) => {
    const newId = idMap.get(inst.id);
    if (!newId) return inst;
    const mappedParent = inst.parentId === null ? null : (idMap.get(inst.parentId) ?? null);
    return {
      ...inst,
      id: newId,
      parentId: mappedParent,
      x: inst.x + dx,
      y: inst.y + dy,
    } as ComponentInstance;
  });
  const newRootId = clones[0]?.id;
  if (!newRootId) return null;
  return {
    instances: [...state.instances, ...clones],
    selectedId: newRootId,
    selectedTarget: instanceSelection(newRootId),
    nextInstanceId: next,
    lastPasteId: newRootId,
  };
}

// Shared guard for any reparent: rejects self-parenting, unknown parents, and
// cycles (dropping onto a descendant). `parentId === null` means "promote to
// root" and is always valid.
function isValidReparentTarget(state: EditorSnapshot, id: string, parentId: string | null): boolean {
  if (parentId === null) return true;
  if (parentId === id) return false;
  if (!state.instances.some((candidate) => candidate.id === parentId)) return false;
  return !collectSubtreeIds(state.instances, id).has(parentId);
}

// Move `id` in the flat `instances` array: reparent under `target.parentId`
// and position just before `target.beforeId` (or append last among that
// parent's siblings when `beforeId` is null). Sibling ordering is driven by
// the array order within each parent's children, so this is the single mutation
// backing both "reorder among siblings" and "reparent" from the layers sidebar.
// No-op when both parent and array index are unchanged so repeated drags don't
// flood history.
export function mutationReorderInstance(
  state: EditorSnapshot,
  id: string,
  target: { parentId: string | null; beforeId: string | null },
): Partial<EditorSnapshot> | null {
  const { parentId, beforeId } = target;
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) return null;
  if (!isValidReparentTarget(state, id, parentId)) return null;
  if (beforeId !== null) {
    if (beforeId === id) return null;
    const before = state.instances.find((candidate) => candidate.id === beforeId);
    if (!before || before.parentId !== parentId) return null;
  }
  const without = state.instances.filter((candidate) => candidate.id !== id);
  const updated = { ...instance, parentId } as ComponentInstance;
  const insertAt = beforeId === null ? without.length : without.findIndex((i) => i.id === beforeId);
  if (insertAt === -1) return null;
  const next = [...without.slice(0, insertAt), updated, ...without.slice(insertAt)];
  if (instance.parentId === parentId && state.instances.indexOf(instance) === next.indexOf(updated)) {
    return null;
  }
  return { instances: next };
}

// Reparent `id` under `parentId` (or promote to root when `parentId` is null)
// without touching its position in the flat array. No-op when unchanged so
// drag pointermove loops don't flood history.
export function mutationSetParent(
  state: EditorSnapshot,
  id: string,
  parentId: string | null,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) return null;
  if (instance.parentId === parentId) return null;
  if (!isValidReparentTarget(state, id, parentId)) return null;
  return {
    instances: state.instances.map((candidate) =>
      candidate.id === id ? ({ ...candidate, parentId } as ComponentInstance) : candidate,
    ),
  };
}

/** After removing dynamic index `removedIndex`, fix a selected `col-*` / `row-*` / `feature-*` layer id. */
function migrateIndexedDynamicLayerSelectionAfterRemove(
  selected: EditorSnapshot['selectedTarget'],
  instanceId: string,
  removedIndex: number,
  dynamicPrefix: 'col' | 'row' | 'feature',
  fallbackGroupLayerId: string,
): EditorSnapshot['selectedTarget'] {
  if (!selected || selected.kind !== 'layer' || selected.instanceId !== instanceId) return selected;
  const m = new RegExp(`^${dynamicPrefix}-(\\d+)$`).exec(selected.layerId);
  if (!m) return selected;
  const i = Number(m[1]);
  if (i === removedIndex) return layerSelection(instanceId, fallbackGroupLayerId);
  if (i > removedIndex) return layerSelection(instanceId, `${dynamicPrefix}-${i - 1}`);
  return selected;
}

export function mutationInsertTableColumn(
  state: EditorSnapshot,
  instanceId: string,
  atIndex?: number,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((i) => i.id === instanceId);
  if (!instance || instance.type !== 'table') return null;
  const { columns, rows } = instance.props;
  const insertAt = atIndex === undefined ? columns.length : Math.max(0, Math.min(atIndex, columns.length));
  const newTitle = `Column ${insertAt + 1}`;
  const nextColumns = [...columns.slice(0, insertAt), newTitle, ...columns.slice(insertAt)];
  const nextRows = rows.map((row) => [...row.slice(0, insertAt), '', ...row.slice(insertAt)]);
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId
        ? ({ ...c, props: { ...instance.props, columns: nextColumns, rows: nextRows } } as ComponentInstance)
        : c,
    ),
    selectedTarget: layerSelection(instanceId, `col-${insertAt}`),
    selectedId: instanceId,
  };
}

export function mutationRemoveTableColumn(
  state: EditorSnapshot,
  instanceId: string,
  index: number,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((i) => i.id === instanceId);
  if (!instance || instance.type !== 'table') return null;
  const { columns, rows } = instance.props;
  if (columns.length <= 1) return null;
  if (index < 0 || index >= columns.length) return null;
  const nextColumns = columns.filter((_, i) => i !== index);
  const nextRows = rows.map((row) => row.filter((_, i) => i !== index));
  const nextSelected = migrateIndexedDynamicLayerSelectionAfterRemove(
    state.selectedTarget,
    instanceId,
    index,
    'col',
    'columns',
  );
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId
        ? ({ ...c, props: { ...instance.props, columns: nextColumns, rows: nextRows } } as ComponentInstance)
        : c,
    ),
    selectedTarget: nextSelected,
  };
}

export function mutationInsertTableRow(
  state: EditorSnapshot,
  instanceId: string,
  atIndex?: number,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((i) => i.id === instanceId);
  if (!instance || instance.type !== 'table') return null;
  const { columns, rows } = instance.props;
  const insertAt = atIndex === undefined ? rows.length : Math.max(0, Math.min(atIndex, rows.length));
  const newRow = columns.map(() => '');
  const nextRows = [...rows.slice(0, insertAt), newRow, ...rows.slice(insertAt)];
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId ? ({ ...c, props: { ...instance.props, rows: nextRows } } as ComponentInstance) : c,
    ),
    selectedTarget: layerSelection(instanceId, `row-${insertAt}`),
    selectedId: instanceId,
  };
}

export function mutationRemoveTableRow(
  state: EditorSnapshot,
  instanceId: string,
  index: number,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((i) => i.id === instanceId);
  if (!instance || instance.type !== 'table') return null;
  const { rows } = instance.props;
  if (index < 0 || index >= rows.length) return null;
  const nextRows = rows.filter((_, i) => i !== index);
  const nextSelected = migrateIndexedDynamicLayerSelectionAfterRemove(
    state.selectedTarget,
    instanceId,
    index,
    'row',
    'rows',
  );
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId ? ({ ...c, props: { ...instance.props, rows: nextRows } } as ComponentInstance) : c,
    ),
    selectedTarget: nextSelected,
  };
}

export function mutationInsertLandingFeature(
  state: EditorSnapshot,
  instanceId: string,
  atIndex?: number,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((i) => i.id === instanceId);
  if (!instance || instance.type !== 'landing') return null;
  const { features } = instance.props;
  const insertAt = atIndex === undefined ? features.length : Math.max(0, Math.min(atIndex, features.length));
  const nextFeatures = [...features.slice(0, insertAt), 'New feature', ...features.slice(insertAt)];
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId
        ? ({ ...c, props: { ...instance.props, features: nextFeatures } } as ComponentInstance)
        : c,
    ),
    selectedTarget: layerSelection(instanceId, `feature-${insertAt}`),
    selectedId: instanceId,
  };
}

export function mutationRemoveLandingFeature(
  state: EditorSnapshot,
  instanceId: string,
  index: number,
): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((i) => i.id === instanceId);
  if (!instance || instance.type !== 'landing') return null;
  const { features } = instance.props;
  if (features.length <= 1) return null;
  if (index < 0 || index >= features.length) return null;
  const nextFeatures = features.filter((_, i) => i !== index);
  const nextSelected = migrateIndexedDynamicLayerSelectionAfterRemove(
    state.selectedTarget,
    instanceId,
    index,
    'feature',
    'features-list',
  );
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId
        ? ({ ...c, props: { ...instance.props, features: nextFeatures } } as ComponentInstance)
        : c,
    ),
    selectedTarget: nextSelected,
  };
}
