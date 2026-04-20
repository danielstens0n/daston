import { create } from 'zustand';
import type { ComponentId, ThemeConfig } from '../../../shared/types.ts';
import { patchTheme } from '../../lib/api.ts';
import { setResolvedThemeConfig } from '../../lib/theme-defaults-context.ts';
import { ancestorChain } from '../hierarchy.ts';
import { instanceSelection, type SelectedTarget } from '../layers.ts';
import {
  createSnapshot,
  type EditorSnapshot,
  mergeSnapshot,
  pickEditorSnapshot,
  restoreSnapshotKeepingCanvas,
  snapshotsEqual,
} from './history.ts';
import {
  baseCardBodyTextProps,
  baseCardProps,
  baseCardTitleTextProps,
  createDefaultCardBodyTextProps,
  createDefaultCardInstances,
  createDefaultCardProps,
  createDefaultCardTitleTextProps,
  DEFAULT_SEED_CARD_INSTANCE_IDS,
} from './instance-defaults.ts';
import {
  clipboardPayloadFromRoot,
  mutationAddImportedInstance,
  mutationAddInstance,
  mutationAddInstanceWithRect,
  mutationCut,
  mutationDuplicate,
  mutationDuplicateInPlaceForDrag,
  mutationInsertLandingFeature,
  mutationInsertTableColumn,
  mutationInsertTableRow,
  mutationMove,
  mutationPaste,
  mutationRemove,
  mutationRemoveLandingFeature,
  mutationRemoveTableColumn,
  mutationRemoveTableRow,
  mutationReorderInstance,
  mutationResize,
  mutationSetParent,
  mutationUpdateProps,
} from './mutations.ts';

/**
 * Global editor store (Zustand). Single source of truth for everything on the
 * canvas: component instances, selection, undo/redo, clipboard, canvas chrome,
 * and the current server theme. Components read slices via the hooks in
 * `selectors.ts` and write via the action methods here — nothing else should
 * mutate this state directly.
 *
 * The store's shape is three concerns layered together:
 *
 *   1. `EditorSnapshot` (defined in `history.ts`) — the part of state that
 *      undo/redo restores: instances, selection, next-id counter, clipboard.
 *   2. `EditorAmbientState` — state that lives in the store but is NOT
 *      undoable: the undo/redo stacks themselves, the active tool, canvas
 *      background, ephemeral drag/edit hints, and the server theme.
 *   3. `EditorActions` — the write API. Undoable mutations go through
 *      `applyMutation`, which pushes the pre-change snapshot onto `past`;
 *      ambient setters use plain `set(...)`.
 */

/** Canvas viewport fill (Figma-style); independent of app chrome theme. */
export const DEFAULT_CANVAS_BACKGROUND = '#3a3d43';

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

/** Ephemeral toolbar/canvas tool; not part of undo history. */
export type CanvasTool = 'select' | Extract<ComponentId, 'ellipse' | 'rectangle' | 'text' | 'triangle'>;

function isPristineDefaultCanvas(snapshot: EditorSnapshot): boolean {
  if (snapshot.instances.length !== 3) return false;
  const { root, titleText, bodyText } = DEFAULT_SEED_CARD_INSTANCE_IDS;
  const card = snapshot.instances.find((i) => i.id === root);
  const title = snapshot.instances.find((i) => i.id === titleText);
  const body = snapshot.instances.find((i) => i.id === bodyText);
  if (!card || card.type !== 'card') return false;
  if (!title || title.type !== 'text' || title.parentId !== root) return false;
  if (!body || body.type !== 'text' || body.parentId !== root) return false;
  return (
    JSON.stringify(card.props) === JSON.stringify(baseCardProps()) &&
    JSON.stringify(title.props) === JSON.stringify(baseCardTitleTextProps()) &&
    JSON.stringify(body.props) === JSON.stringify(baseCardBodyTextProps())
  );
}

/** Store state that is NOT part of undo/redo (history stacks, tool, theme, ephemeral drag hints). */
type EditorAmbientState = {
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  historyBatch: EditorSnapshot | null;
  canvasBackgroundColor: string;
  activeTool: CanvasTool;
  /** Set by the canvas after creating a text instance; Text preview consumes to open the inline editor. */
  pendingTextEditInstanceId: string | null;
  /** Ephemeral preview of the parent an in-progress drag will land inside; not part of undo history. */
  dropTargetId: string | null;
  /** Wrapper currently under the pointer while the select tool is active; drives the hover outline. */
  hoveredId: string | null;
  /**
   * Figma-style "entered" container. While non-null, clicking any descendant of
   * this instance selects the direct child of this root on the hit path
   * instead of the outermost ancestor.
   */
  selectionRootId: string | null;
  /** Last theme from server; drives color variables in the picker. */
  themeConfig: ThemeConfig | null;
};

type EditorActions = {
  setActiveTool: (tool: CanvasTool) => void;
  setPendingTextEditInstanceId: (id: string | null) => void;
  setDropTargetId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  setSelectionRootId: (id: string | null) => void;
  popSelectionRoot: () => void;
  setCanvasBackgroundColor: (color: string) => void;

  applyInitialThemeFromServer: (theme: ThemeConfig) => void;
  upsertThemeColor: (name: string, hex: string) => Promise<void>;

  select: (id: string | null) => void;
  selectLayer: (target: Extract<SelectedTarget, { kind: 'layer' }>) => void;

  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  undo: () => void;
  redo: () => void;

  move: (id: string, pos: Point) => void;
  resize: (id: string, rect: Rect) => void;
  addInstance: (type: ComponentId, worldCenter: Point) => void;
  addInstanceWithRect: (type: ComponentId, rect: Rect) => void;
  addImportedInstance: (definitionId: string, worldCenter: Point) => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  setParent: (id: string, parentId: string | null) => void;
  reorderInstance: (id: string, target: { parentId: string | null; beforeId: string | null }) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  duplicateInPlaceForDrag: (id: string) => string | null;

  copy: (id: string) => void;
  cut: (id: string) => void;
  paste: (options?: { at?: Point }) => void;

  insertTableColumn: (id: string, atIndex?: number) => void;
  removeTableColumn: (id: string, index: number) => void;
  insertTableRow: (id: string, atIndex?: number) => void;
  removeTableRow: (id: string, index: number) => void;
  insertLandingFeature: (id: string, atIndex?: number) => void;
  removeLandingFeature: (id: string, index: number) => void;
};

export type EditorStore = EditorSnapshot & EditorAmbientState & EditorActions;

export const useEditorStore = create<EditorStore>((set) => {
  function applyMutation(recipe: (snapshot: EditorSnapshot) => Partial<EditorSnapshot> | null): void {
    set((state) => {
      const snapshot = pickEditorSnapshot(state);
      const patch = recipe(snapshot);
      if (!patch) return state;
      // Clear ambient drill-down / hover references if the instance they
      // point at no longer exists after the mutation (e.g. remove/cut).
      // Skip the O(n) scan entirely when the mutation didn't touch
      // `instances` or when nothing ambient is set — the pointermove / drag
      // path goes through here on every frame.
      let ambient: Partial<EditorStore> | null = null;
      if (patch.instances && (state.selectionRootId || state.hoveredId)) {
        const ids = new Set(patch.instances.map((i) => i.id));
        if (state.selectionRootId && !ids.has(state.selectionRootId)) {
          ambient = { selectionRootId: null };
        }
        if (state.hoveredId && !ids.has(state.hoveredId)) {
          ambient = { ...ambient, hoveredId: null };
        }
      }
      if (state.historyBatch) {
        const base = state.future.length === 0 ? patch : { ...patch, future: [] };
        return ambient ? { ...base, ...ambient } : base;
      }
      const before = createSnapshot(snapshot);
      const after = mergeSnapshot(snapshot, patch);
      if (snapshotsEqual(before, after)) {
        return ambient ? { ...state, ...ambient } : state;
      }
      return {
        ...patch,
        ...ambient,
        past: [...state.past, before],
        future: [],
      };
    });
  }

  return {
    instances: createDefaultCardInstances(null),
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 4,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
    canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
    themeConfig: null,
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),
    pendingTextEditInstanceId: null,
    setPendingTextEditInstanceId: (id) => set({ pendingTextEditInstanceId: id }),
    dropTargetId: null,
    setDropTargetId: (id) => set({ dropTargetId: id }),
    hoveredId: null,
    setHoveredId: (id) => set({ hoveredId: id }),
    selectionRootId: null,
    setSelectionRootId: (id) => set({ selectionRootId: id }),
    popSelectionRoot: () =>
      set((state) => {
        if (state.selectionRootId === null) return state;
        // Walk up one level; `ancestorChain[1]` is the parent (chain is self-first).
        const parent = ancestorChain(state.instances, state.selectionRootId)[1] ?? null;
        return { selectionRootId: parent };
      }),
    setCanvasBackgroundColor: (color) => set({ canvasBackgroundColor: color }),
    applyInitialThemeFromServer: (theme) =>
      set((state) => {
        setResolvedThemeConfig(theme);
        const base = { themeConfig: theme };
        const snapshot = pickEditorSnapshot(state);
        if (!isPristineDefaultCanvas(snapshot)) {
          return base;
        }
        const { root, titleText, bodyText } = DEFAULT_SEED_CARD_INSTANCE_IDS;
        return {
          ...base,
          instances: state.instances.map((inst) => {
            if (inst.id === root && inst.type === 'card') {
              return { ...inst, props: createDefaultCardProps(theme) };
            }
            if (inst.id === titleText && inst.type === 'text') {
              return { ...inst, props: createDefaultCardTitleTextProps(theme) };
            }
            if (inst.id === bodyText && inst.type === 'text') {
              return { ...inst, props: createDefaultCardBodyTextProps(theme) };
            }
            return inst;
          }),
        };
      }),
    upsertThemeColor: async (name, hex) => {
      const key = name.trim();
      if (!key) return;
      const normalized = hex.trim().toLowerCase();
      const updated = await patchTheme({ colors: { [key]: normalized } });
      setResolvedThemeConfig(updated);
      set({ themeConfig: updated });
    },
    select: (id) =>
      set({
        selectedId: id,
        selectedTarget: id ? instanceSelection(id) : null,
      }),
    selectLayer: (target) =>
      set({
        selectedId: target.instanceId,
        selectedTarget: target,
      }),
    beginHistoryBatch: () =>
      set((state) => {
        if (state.historyBatch) return state;
        return { historyBatch: createSnapshot(pickEditorSnapshot(state)) };
      }),
    endHistoryBatch: () =>
      set((state) => {
        if (!state.historyBatch) return state;
        const current = createSnapshot(pickEditorSnapshot(state));
        if (snapshotsEqual(state.historyBatch, current)) {
          return { historyBatch: null };
        }
        return {
          past: [...state.past, state.historyBatch],
          future: [],
          historyBatch: null,
        };
      }),
    undo: () =>
      set((state) => {
        if (state.historyBatch || state.past.length === 0) return state;
        const previous = state.past.at(-1);
        if (!previous) return state;
        return {
          ...restoreSnapshotKeepingCanvas(state.canvasBackgroundColor, previous),
          past: state.past.slice(0, -1),
          future: [createSnapshot(pickEditorSnapshot(state)), ...state.future],
        };
      }),
    redo: () =>
      set((state) => {
        if (state.historyBatch || state.future.length === 0) return state;
        const [next, ...future] = state.future;
        if (!next) return state;
        return {
          ...restoreSnapshotKeepingCanvas(state.canvasBackgroundColor, next),
          past: [...state.past, createSnapshot(pickEditorSnapshot(state))],
          future,
        };
      }),
    move: (id, pos) => applyMutation((snapshot) => mutationMove(snapshot, id, pos)),
    resize: (id, rect) => applyMutation((snapshot) => mutationResize(snapshot, id, rect)),
    addInstance: (type, worldCenter) =>
      applyMutation((snapshot) => mutationAddInstance(snapshot, type, worldCenter)),
    addInstanceWithRect: (type, rect) =>
      applyMutation((snapshot) => mutationAddInstanceWithRect(snapshot, type, rect)),
    addImportedInstance: (definitionId, worldCenter) =>
      applyMutation((snapshot) => mutationAddImportedInstance(snapshot, definitionId, worldCenter)),
    updateProps: (id, patch) => applyMutation((snapshot) => mutationUpdateProps(snapshot, id, patch)),
    setParent: (id, parentId) => applyMutation((snapshot) => mutationSetParent(snapshot, id, parentId)),
    reorderInstance: (id, target) =>
      applyMutation((snapshot) => mutationReorderInstance(snapshot, id, target)),
    remove: (id) => applyMutation((snapshot) => mutationRemove(snapshot, id)),
    duplicate: (id) => applyMutation((snapshot) => mutationDuplicate(snapshot, id)),
    duplicateInPlaceForDrag: (id) => {
      let createdId: string | null = null;
      applyMutation((snapshot) => {
        const result = mutationDuplicateInPlaceForDrag(snapshot, id);
        if (!result) return null;
        createdId = result.createdId;
        return result.patch;
      });
      return createdId;
    },
    copy: (id) =>
      set((state) => {
        if (!state.instances.some((instance) => instance.id === id)) return state;
        return { clipboard: clipboardPayloadFromRoot(state.instances, id), lastPasteId: null };
      }),
    cut: (id) => applyMutation((snapshot) => mutationCut(snapshot, id)),
    paste: (options) => applyMutation((snapshot) => mutationPaste(snapshot, options)),
    insertTableColumn: (id, atIndex) =>
      applyMutation((snapshot) => mutationInsertTableColumn(snapshot, id, atIndex)),
    removeTableColumn: (id, index) =>
      applyMutation((snapshot) => mutationRemoveTableColumn(snapshot, id, index)),
    insertTableRow: (id, atIndex) =>
      applyMutation((snapshot) => mutationInsertTableRow(snapshot, id, atIndex)),
    removeTableRow: (id, index) => applyMutation((snapshot) => mutationRemoveTableRow(snapshot, id, index)),
    insertLandingFeature: (id, atIndex) =>
      applyMutation((snapshot) => mutationInsertLandingFeature(snapshot, id, atIndex)),
    removeLandingFeature: (id, index) =>
      applyMutation((snapshot) => mutationRemoveLandingFeature(snapshot, id, index)),
  };
});
