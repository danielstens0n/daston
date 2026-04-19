import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentId } from '../../shared/types.ts';
import type {
  ButtonInstance,
  ButtonProps,
  CardInstance,
  CardProps,
  ComponentInstance,
  ImportedInstance,
  LandingInstance,
  LandingProps,
  TableInstance,
  TableProps,
} from './types.ts';

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

// Minimum drag-resize dimensions. Clamped at the store so the drag hook
// doesn't need to know the rule.
const MIN_SIZE = 40;

// Offset applied on every duplicate and on each cascading paste. Matches
// Figma's visual nudge so the clone is obviously distinct from the source.
const PASTE_OFFSET = 20;

type EditorStore = {
  instances: ComponentInstance[];
  selectedId: string | null;
  // Monotonic counter for generated ids. Starts at 2 because the seeded
  // default card uses `card-1`. Shared across all component types — ids
  // follow the `${type}-${n}` convention.
  nextInstanceId: number;
  // Internal clipboard for copy/cut/paste. Not persisted; not the system
  // clipboard. Figma uses its own internal clipboard too.
  clipboard: ComponentInstance | null;
  // Id of the most recently pasted instance. Each paste cascades from this
  // instance's current position (so moving a paste between presses carries
  // through). `copy`/`cut` reset this to null so the first paste after a
  // copy restarts from the clipboard snapshot. `remove` clears it if the
  // target is deleted.
  lastPasteId: string | null;
  select: (id: string | null) => void;
  move: (id: string, pos: Point) => void;
  resize: (id: string, rect: Rect) => void;
  addInstance: (type: ComponentId, worldCenter: Point) => void;
  addImportedInstance: (definitionId: string, worldCenter: Point) => void;
  // Generic at the store level. Type safety for specific props lives at the
  // call site (see Sidebar.tsx), where the instance has been narrowed.
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  /** Clone at the source's current x/y (no paste offset). Returns the new id. */
  duplicateInPlaceForDrag: (id: string) => string | null;
  copy: (id: string) => void;
  cut: (id: string) => void;
  paste: () => void;
};

// Shared default prop values for new cards. The default card uses the same
// set, so seeding and `addInstance` stay consistent.
const defaultCardProps: CardProps = {
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
};

const DEFAULT_CARD_WIDTH = 280;
const DEFAULT_CARD_HEIGHT = 180;
const DEFAULT_BUTTON_WIDTH = 160;
const DEFAULT_BUTTON_HEIGHT = 44;
const DEFAULT_TABLE_WIDTH = 320;
const DEFAULT_TABLE_HEIGHT = 220;
const DEFAULT_LANDING_WIDTH = 360;
const DEFAULT_LANDING_HEIGHT = 480;
const DEFAULT_IMPORTED_WIDTH = 320;
const DEFAULT_IMPORTED_HEIGHT = 220;

const defaultButtonProps: ButtonProps = {
  label: 'Button',
  textColor: '#ffffff',
  fill: '#3b82f6',
  borderColor: '#2563eb',
  borderWidth: 1,
  borderRadius: 8,
  paddingX: 20,
  paddingY: 10,
  shadowEnabled: true,
  shadowColor: '#00000026',
  shadowBlur: 8,
  shadowOffsetY: 2,
};

const defaultTableProps: TableProps = {
  showHeader: true,
  zebra: true,
  cellPadding: 10,
  headerFill: '#f4f4f5',
  rowFill: '#ffffff',
  rowFillAlt: '#fafafa',
  borderColor: '#e4e4e7',
  borderWidth: 1,
  borderRadius: 8,
  headerTextColor: '#18181b',
  bodyTextColor: '#52525b',
};

const defaultLandingProps: LandingProps = {
  heroTitle: 'Build faster',
  heroBody: 'Ship polished UI with your design tokens.',
  ctaLabel: 'Get started',
  accentColor: '#3b82f6',
  pageFill: '#f7f7f8',
  heroFill: '#ffffff',
  featuresFill: '#f4f4f5',
  borderRadius: 12,
  shadowEnabled: true,
  shadowColor: '#0000001a',
  shadowBlur: 16,
  shadowOffsetY: 4,
};

const defaultCard: CardInstance = {
  id: 'card-1',
  type: 'card',
  x: 120,
  y: 120,
  width: DEFAULT_CARD_WIDTH,
  height: DEFAULT_CARD_HEIGHT,
  props: defaultCardProps,
};

export const useEditorStore = create<EditorStore>((set) => ({
  instances: [defaultCard],
  selectedId: null,
  nextInstanceId: 2,
  clipboard: null,
  lastPasteId: null,
  select: (id) => set({ selectedId: id }),
  move: (id, pos) =>
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id ? { ...instance, x: pos.x, y: pos.y } : instance,
      ),
    })),
  resize: (id, rect) =>
    set((state) => {
      const width = Math.max(MIN_SIZE, rect.width);
      const height = Math.max(MIN_SIZE, rect.height);
      return {
        instances: state.instances.map((instance) =>
          instance.id === id ? { ...instance, x: rect.x, y: rect.y, width, height } : instance,
        ),
      };
    }),
  addInstance: (type, worldCenter) =>
    set((state) => {
      switch (type) {
        case 'card': {
          const id = `${type}-${state.nextInstanceId}`;
          const instance: CardInstance = {
            id,
            type: 'card',
            x: worldCenter.x - DEFAULT_CARD_WIDTH / 2,
            y: worldCenter.y - DEFAULT_CARD_HEIGHT / 2,
            width: DEFAULT_CARD_WIDTH,
            height: DEFAULT_CARD_HEIGHT,
            props: defaultCardProps,
          };
          return {
            instances: [...state.instances, instance],
            selectedId: id,
            nextInstanceId: state.nextInstanceId + 1,
          };
        }
        case 'button': {
          const id = `${type}-${state.nextInstanceId}`;
          const instance: ButtonInstance = {
            id,
            type: 'button',
            x: worldCenter.x - DEFAULT_BUTTON_WIDTH / 2,
            y: worldCenter.y - DEFAULT_BUTTON_HEIGHT / 2,
            width: DEFAULT_BUTTON_WIDTH,
            height: DEFAULT_BUTTON_HEIGHT,
            props: defaultButtonProps,
          };
          return {
            instances: [...state.instances, instance],
            selectedId: id,
            nextInstanceId: state.nextInstanceId + 1,
          };
        }
        case 'table': {
          const id = `${type}-${state.nextInstanceId}`;
          const instance: TableInstance = {
            id,
            type: 'table',
            x: worldCenter.x - DEFAULT_TABLE_WIDTH / 2,
            y: worldCenter.y - DEFAULT_TABLE_HEIGHT / 2,
            width: DEFAULT_TABLE_WIDTH,
            height: DEFAULT_TABLE_HEIGHT,
            props: defaultTableProps,
          };
          return {
            instances: [...state.instances, instance],
            selectedId: id,
            nextInstanceId: state.nextInstanceId + 1,
          };
        }
        case 'landing': {
          const id = `${type}-${state.nextInstanceId}`;
          const instance: LandingInstance = {
            id,
            type: 'landing',
            x: worldCenter.x - DEFAULT_LANDING_WIDTH / 2,
            y: worldCenter.y - DEFAULT_LANDING_HEIGHT / 2,
            width: DEFAULT_LANDING_WIDTH,
            height: DEFAULT_LANDING_HEIGHT,
            props: defaultLandingProps,
          };
          return {
            instances: [...state.instances, instance],
            selectedId: id,
            nextInstanceId: state.nextInstanceId + 1,
          };
        }
      }
    }),
  addImportedInstance: (definitionId, worldCenter) =>
    set((state) => {
      const id = `imported-${state.nextInstanceId}`;
      const instance: ImportedInstance = {
        id,
        type: 'imported',
        definitionId,
        x: worldCenter.x - DEFAULT_IMPORTED_WIDTH / 2,
        y: worldCenter.y - DEFAULT_IMPORTED_HEIGHT / 2,
        width: DEFAULT_IMPORTED_WIDTH,
        height: DEFAULT_IMPORTED_HEIGHT,
        props: {},
      };
      return {
        instances: [...state.instances, instance],
        selectedId: id,
        nextInstanceId: state.nextInstanceId + 1,
      };
    }),
  updateProps: (id, patch) =>
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id
          ? ({ ...instance, props: { ...instance.props, ...patch } } as ComponentInstance)
          : instance,
      ),
    })),
  remove: (id) =>
    set((state) => ({
      instances: state.instances.filter((instance) => instance.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      lastPasteId: state.lastPasteId === id ? null : state.lastPasteId,
    })),
  duplicate: (id) =>
    set((state) => {
      const src = state.instances.find((instance) => instance.id === id);
      if (!src) return state;
      const clone = {
        ...src,
        id: `${src.type}-${state.nextInstanceId}`,
        x: src.x + PASTE_OFFSET,
        y: src.y + PASTE_OFFSET,
      } as ComponentInstance;
      return {
        instances: [...state.instances, clone],
        selectedId: clone.id,
        nextInstanceId: state.nextInstanceId + 1,
      };
    }),
  duplicateInPlaceForDrag: (id) => {
    let createdId: string | null = null;
    set((state) => {
      const src = state.instances.find((instance) => instance.id === id);
      if (!src) return state;
      const cloneId = `${src.type}-${state.nextInstanceId}`;
      createdId = cloneId;
      const clone = { ...src, id: cloneId } as ComponentInstance;
      return {
        instances: [...state.instances, clone],
        selectedId: cloneId,
        nextInstanceId: state.nextInstanceId + 1,
      };
    });
    return createdId;
  },
  copy: (id) =>
    set((state) => {
      const src = state.instances.find((instance) => instance.id === id);
      if (!src) return state;
      return { clipboard: src, lastPasteId: null };
    }),
  cut: (id) =>
    set((state) => {
      const src = state.instances.find((instance) => instance.id === id);
      if (!src) return state;
      return {
        instances: state.instances.filter((instance) => instance.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
        clipboard: src,
        lastPasteId: null,
      };
    }),
  // Paste cascades: position comes from the last-pasted instance's current
  // position (so a move between pastes carries through), but everything
  // else (type, size, props) comes from the clipboard snapshot — editing
  // a pasted instance does not change what future pastes look like.
  paste: () =>
    set((state) => {
      const { clipboard } = state;
      if (!clipboard) return state;
      const lastPasted = state.lastPasteId
        ? (state.instances.find((instance) => instance.id === state.lastPasteId) ?? null)
        : null;
      const base = lastPasted ?? clipboard;
      const newId = `${clipboard.type}-${state.nextInstanceId}`;
      const clone = {
        ...clipboard,
        id: newId,
        x: base.x + PASTE_OFFSET,
        y: base.y + PASTE_OFFSET,
      } as ComponentInstance;
      return {
        instances: [...state.instances, clone],
        selectedId: newId,
        lastPasteId: newId,
        nextInstanceId: state.nextInstanceId + 1,
      };
    }),
}));

// Selector hooks. Each subscribes to the smallest possible slice so drag
// updates don't re-render unrelated consumers. Leaf components call the hook
// they need directly — parents pass ids rather than drilling objects.

// Stable list of instance ids. `useShallow` compares element-by-element so
// moving a card (which creates a new instances array but keeps the id list
// unchanged) does not re-render the route.
export function useInstanceIds(): string[] {
  return useEditorStore(useShallow((state) => state.instances.map((instance) => instance.id)));
}

// A single instance by id. Same-reference until its fields are mutated, so
// previews only re-render when their own instance changes.
export function useInstance(id: string): ComponentInstance | null {
  return useEditorStore((state) => state.instances.find((instance) => instance.id === id) ?? null);
}

// Narrow hook for the Card inspector. Returns just the props slice, so
// dragging (which changes x/y but keeps props' reference) does not re-render
// the inspector; editing a prop does. Returns null if the id doesn't resolve
// to a card — useful defensively, even though the Sidebar only calls this
// after narrowing via type.
export function useCardProps(id: string): CardProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'card') return null;
    return instance.props;
  });
}

export function useButtonProps(id: string): ButtonProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'button') return null;
    return instance.props;
  });
}

export function useTableProps(id: string): TableProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'table') return null;
    return instance.props;
  });
}

export function useLandingProps(id: string): LandingProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'landing') return null;
    return instance.props;
  });
}

// Meta view of the currently selected instance: just id + type. Used by the
// sidebar to render its header and pick an inspector. Via `useShallow`, this
// is stable across drags and prop edits — only selection changes re-render.
export type SelectedInstanceMeta = Pick<ComponentInstance, 'id' | 'type'>;

export function useSelectedInstanceMeta(): SelectedInstanceMeta | null {
  return useEditorStore(
    useShallow((state): SelectedInstanceMeta | null => {
      if (state.selectedId === null) return null;
      const instance = state.instances.find((i) => i.id === state.selectedId);
      if (!instance) return null;
      return { id: instance.id, type: instance.type };
    }),
  );
}

export function useIsSelected(id: string): boolean {
  return useEditorStore((state) => state.selectedId === id);
}
