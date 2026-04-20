import type { ComponentId } from '../../shared/types.ts';
import type { EditorSnapshot } from './editor-history.ts';
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
import { instanceSelection } from './layers.ts';
import type { ComponentInstance } from './types.ts';

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
