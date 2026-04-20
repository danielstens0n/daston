import { create } from 'zustand';
import type { ComponentId } from '../../shared/types.ts';
import {
  createSnapshot,
  type EditorSnapshot,
  mergeSnapshot,
  pickEditorSnapshot,
  restoreSnapshotKeepingCanvas,
  snapshotsEqual,
} from './editor-history.ts';
import {
  mutationAddImportedInstance,
  mutationAddInstance,
  mutationCut,
  mutationDuplicate,
  mutationDuplicateInPlaceForDrag,
  mutationMove,
  mutationPaste,
  mutationRemove,
  mutationResize,
  mutationUpdateProps,
} from './editor-mutations.ts';
import { defaultCard } from './instance-defaults.ts';
import { instanceSelection, type SelectedTarget } from './layers.ts';

/** Canvas viewport fill (Figma-style); independent of app chrome theme. */
export const DEFAULT_CANVAS_BACKGROUND = '#f7f7f8';

type Rect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };

type EditorStoreActions = {
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  historyBatch: EditorSnapshot | null;
  canvasBackgroundColor: string;
  setCanvasBackgroundColor: (color: string) => void;
  select: (id: string | null) => void;
  selectLayer: (target: Extract<SelectedTarget, { kind: 'layer' }>) => void;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  undo: () => void;
  redo: () => void;
  move: (id: string, pos: Point) => void;
  resize: (id: string, rect: Rect) => void;
  addInstance: (type: ComponentId, worldCenter: Point) => void;
  addImportedInstance: (definitionId: string, worldCenter: Point) => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  duplicateInPlaceForDrag: (id: string) => string | null;
  copy: (id: string) => void;
  cut: (id: string) => void;
  paste: (options?: { at?: Point }) => void;
};

type FullEditorStore = EditorSnapshot & EditorStoreActions;

export const useEditorStore = create<FullEditorStore>((set) => {
  function applyMutation(recipe: (snapshot: EditorSnapshot) => Partial<EditorSnapshot> | null): void {
    set((state) => {
      const snapshot = pickEditorSnapshot(state);
      const patch = recipe(snapshot);
      if (!patch) return state;
      if (state.historyBatch) {
        return state.future.length === 0 ? patch : { ...patch, future: [] };
      }
      const before = createSnapshot(snapshot);
      const after = mergeSnapshot(snapshot, patch);
      if (snapshotsEqual(before, after)) return state;
      return {
        ...patch,
        past: [...state.past, before],
        future: [],
      };
    });
  }

  return {
    instances: [defaultCard],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
    canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
    setCanvasBackgroundColor: (color) => set({ canvasBackgroundColor: color }),
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
    addImportedInstance: (definitionId, worldCenter) =>
      applyMutation((snapshot) => mutationAddImportedInstance(snapshot, definitionId, worldCenter)),
    updateProps: (id, patch) => applyMutation((snapshot) => mutationUpdateProps(snapshot, id, patch)),
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
        const src = state.instances.find((instance) => instance.id === id);
        if (!src) return state;
        return { clipboard: structuredClone(src), lastPasteId: null };
      }),
    cut: (id) => applyMutation((snapshot) => mutationCut(snapshot, id)),
    paste: (options) => applyMutation((snapshot) => mutationPaste(snapshot, options)),
  };
});
