import type { ComponentId } from '../../../shared/types.ts';
import { instanceSelection, layerSelection } from '../layers.ts';
import type { ComponentInstance } from '../types.ts';
import type { EditorSnapshot } from './history.ts';
import {
  createDefaultButtonProps,
  createDefaultCardProps,
  createDefaultLandingProps,
  createDefaultTableProps,
  DEFAULT_BUTTON_HEIGHT,
  DEFAULT_BUTTON_WIDTH,
  DEFAULT_CARD_HEIGHT,
  DEFAULT_CARD_WIDTH,
  DEFAULT_IMPORTED_HEIGHT,
  DEFAULT_IMPORTED_WIDTH,
  DEFAULT_LANDING_HEIGHT,
  DEFAULT_LANDING_WIDTH,
  DEFAULT_TABLE_HEIGHT,
  DEFAULT_TABLE_WIDTH,
} from './instance-defaults.ts';

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type BaseGeometry = { id: string; x: number; y: number; width: number; height: number };

export const MIN_SIZE = 40;
export const PASTE_OFFSET = 20;

const STOCK_INSTANCE_FACTORIES = {
  card: {
    width: DEFAULT_CARD_WIDTH,
    height: DEFAULT_CARD_HEIGHT,
    build: (base: BaseGeometry): ComponentInstance => ({
      ...base,
      type: 'card',
      props: createDefaultCardProps(),
    }),
  },
  button: {
    width: DEFAULT_BUTTON_WIDTH,
    height: DEFAULT_BUTTON_HEIGHT,
    build: (base: BaseGeometry): ComponentInstance => ({
      ...base,
      type: 'button',
      props: createDefaultButtonProps(),
    }),
  },
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
} as const satisfies Record<
  ComponentId,
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

export function mutationMove(state: EditorSnapshot, id: string, pos: Point): Partial<EditorSnapshot> | null {
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) return null;
  if (instance.x === pos.x && instance.y === pos.y) return null;
  return {
    instances: state.instances.map((candidate) =>
      candidate.id === id ? { ...candidate, x: pos.x, y: pos.y } : candidate,
    ),
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
  const factory = STOCK_INSTANCE_FACTORIES[type];
  const instance = factory.build({
    id: `${type}-${state.nextInstanceId}`,
    x: worldCenter.x - factory.width / 2,
    y: worldCenter.y - factory.height / 2,
    width: factory.width,
    height: factory.height,
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

export function mutationRemove(state: EditorSnapshot, id: string): Partial<EditorSnapshot> | null {
  if (!state.instances.some((instance) => instance.id === id)) return null;
  return {
    instances: state.instances.filter((instance) => instance.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    selectedTarget: state.selectedTarget?.instanceId === id ? null : state.selectedTarget,
    lastPasteId: state.lastPasteId === id ? null : state.lastPasteId,
  };
}

export function mutationDuplicate(state: EditorSnapshot, id: string): Partial<EditorSnapshot> | null {
  const src = state.instances.find((instance) => instance.id === id);
  if (!src) return null;
  const clone = {
    ...src,
    id: `${src.type}-${state.nextInstanceId}`,
    x: src.x + PASTE_OFFSET,
    y: src.y + PASTE_OFFSET,
  } as ComponentInstance;
  return commitNewInstance(state, clone);
}

export function mutationDuplicateInPlaceForDrag(
  state: EditorSnapshot,
  id: string,
): { patch: Partial<EditorSnapshot>; createdId: string } | null {
  const src = state.instances.find((instance) => instance.id === id);
  if (!src) return null;
  const clone = { ...src, id: `${src.type}-${state.nextInstanceId}` } as ComponentInstance;
  return { createdId: clone.id, patch: commitNewInstance(state, clone) };
}

export function mutationCut(state: EditorSnapshot, id: string): Partial<EditorSnapshot> | null {
  const src = state.instances.find((instance) => instance.id === id);
  if (!src) return null;
  return {
    instances: state.instances.filter((instance) => instance.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    selectedTarget: state.selectedTarget?.instanceId === id ? null : state.selectedTarget,
    clipboard: structuredClone(src),
    lastPasteId: null,
  };
}

export function mutationPaste(
  state: EditorSnapshot,
  options?: { at?: Point },
): Partial<EditorSnapshot> | null {
  const { clipboard } = state;
  if (!clipboard) return null;
  const newId = `${clipboard.type}-${state.nextInstanceId}`;
  let x: number;
  let y: number;
  if (options?.at !== undefined) {
    x = options.at.x - clipboard.width / 2;
    y = options.at.y - clipboard.height / 2;
  } else {
    const lastPasted = state.lastPasteId
      ? (state.instances.find((instance) => instance.id === state.lastPasteId) ?? null)
      : null;
    const base = lastPasted ?? clipboard;
    x = base.x + PASTE_OFFSET;
    y = base.y + PASTE_OFFSET;
  }
  const clone = { ...clipboard, id: newId, x, y } as ComponentInstance;
  return { ...commitNewInstance(state, clone), lastPasteId: newId };
}

function migrateTableColumnSelection(
  selected: EditorSnapshot['selectedTarget'],
  instanceId: string,
  mode: 'insert' | 'remove',
  index: number,
): EditorSnapshot['selectedTarget'] {
  if (!selected || selected.kind !== 'layer' || selected.instanceId !== instanceId) return selected;
  const m = /^col-(\d+)$/.exec(selected.layerId);
  if (!m) return selected;
  const i = Number(m[1]);
  if (mode === 'remove') {
    if (i === index) return layerSelection(instanceId, 'columns');
    if (i > index) return layerSelection(instanceId, `col-${i - 1}`);
    return selected;
  }
  if (i >= index) return layerSelection(instanceId, `col-${i + 1}`);
  return selected;
}

function migrateTableRowSelection(
  selected: EditorSnapshot['selectedTarget'],
  instanceId: string,
  mode: 'insert' | 'remove',
  index: number,
): EditorSnapshot['selectedTarget'] {
  if (!selected || selected.kind !== 'layer' || selected.instanceId !== instanceId) return selected;
  const m = /^row-(\d+)$/.exec(selected.layerId);
  if (!m) return selected;
  const i = Number(m[1]);
  if (mode === 'remove') {
    if (i === index) return layerSelection(instanceId, 'rows');
    if (i > index) return layerSelection(instanceId, `row-${i - 1}`);
    return selected;
  }
  if (i >= index) return layerSelection(instanceId, `row-${i + 1}`);
  return selected;
}

function migrateLandingFeatureSelection(
  selected: EditorSnapshot['selectedTarget'],
  instanceId: string,
  mode: 'insert' | 'remove',
  index: number,
): EditorSnapshot['selectedTarget'] {
  if (!selected || selected.kind !== 'layer' || selected.instanceId !== instanceId) return selected;
  const m = /^feature-(\d+)$/.exec(selected.layerId);
  if (!m) return selected;
  const i = Number(m[1]);
  if (mode === 'remove') {
    if (i === index) return layerSelection(instanceId, 'features-list');
    if (i > index) return layerSelection(instanceId, `feature-${i - 1}`);
    return selected;
  }
  if (i >= index) return layerSelection(instanceId, `feature-${i + 1}`);
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
  const nextSelected = migrateTableColumnSelection(state.selectedTarget, instanceId, 'remove', index);
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
  const nextSelected = migrateTableRowSelection(state.selectedTarget, instanceId, 'remove', index);
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
  const nextSelected = migrateLandingFeatureSelection(state.selectedTarget, instanceId, 'remove', index);
  return {
    instances: state.instances.map((c) =>
      c.id === instanceId
        ? ({ ...c, props: { ...instance.props, features: nextFeatures } } as ComponentInstance)
        : c,
    ),
    selectedTarget: nextSelected,
  };
}
