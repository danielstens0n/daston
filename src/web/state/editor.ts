import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentId } from '../../shared/types.ts';
import type { CardInstance, CardProps, ComponentInstance } from './types.ts';

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

// Minimum drag-resize dimensions. Clamped at the store so the drag hook
// doesn't need to know the rule.
const MIN_SIZE = 40;

type EditorStore = {
  instances: ComponentInstance[];
  selectedId: string | null;
  // Monotonic counter for generated ids. Starts at 2 because the seeded
  // default card uses `card-1`. Shared across all component types — ids
  // follow the `${type}-${n}` convention.
  nextInstanceId: number;
  // Reserved for DAS-1 (keyboard shortcuts / copy-paste). The clipboard
  // holds the most recently copied instance snapshot; lastPasteId lets the
  // paste action offset successive pastes of the same clipboard entry.
  // Actions are not wired up yet.
  clipboard: ComponentInstance | null;
  lastPasteId: string | null;
  select: (id: string | null) => void;
  move: (id: string, pos: Point) => void;
  resize: (id: string, rect: Rect) => void;
  addInstance: (type: ComponentId, worldCenter: Point) => void;
  // Generic at the store level. Type safety for specific props lives at the
  // call site (see Sidebar.tsx), where the instance has been narrowed.
  updateProps: (id: string, patch: Record<string, unknown>) => void;
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
        // The toolbar disables button/table/landing today, so addInstance is
        // never called for them. If a future caller forgets, fail loudly.
        case 'button':
        case 'table':
        case 'landing':
          throw new Error(`addInstance: component type "${type}" is not implemented yet`);
      }
    }),
  updateProps: (id, patch) =>
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id
          ? ({ ...instance, props: { ...instance.props, ...patch } } as ComponentInstance)
          : instance,
      ),
    })),
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
