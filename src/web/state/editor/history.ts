import type { SelectedTarget } from '../layers.ts';
import type { ComponentInstance } from '../types.ts';

export type EditorSnapshot = {
  instances: ComponentInstance[];
  selectedId: string | null;
  selectedTarget: SelectedTarget | null;
  nextInstanceId: number;
  clipboard: ComponentInstance | null;
  lastPasteId: string | null;
};

export function pickEditorSnapshot(state: EditorSnapshot): EditorSnapshot {
  return {
    instances: state.instances,
    selectedId: state.selectedId,
    selectedTarget: state.selectedTarget,
    nextInstanceId: state.nextInstanceId,
    clipboard: state.clipboard,
    lastPasteId: state.lastPasteId,
  };
}

export function createSnapshot(source: EditorSnapshot): EditorSnapshot {
  return structuredClone({
    instances: source.instances,
    selectedId: source.selectedId,
    selectedTarget: source.selectedTarget,
    nextInstanceId: source.nextInstanceId,
    clipboard: source.clipboard,
    lastPasteId: source.lastPasteId,
  });
}

export function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeSnapshot(state: EditorSnapshot, patch: Partial<EditorSnapshot>): EditorSnapshot {
  return createSnapshot({
    instances: Object.hasOwn(patch, 'instances') ? (patch.instances ?? state.instances) : state.instances,
    selectedId: Object.hasOwn(patch, 'selectedId') ? (patch.selectedId ?? null) : state.selectedId,
    selectedTarget: Object.hasOwn(patch, 'selectedTarget')
      ? (patch.selectedTarget ?? null)
      : state.selectedTarget,
    nextInstanceId: Object.hasOwn(patch, 'nextInstanceId')
      ? (patch.nextInstanceId ?? state.nextInstanceId)
      : state.nextInstanceId,
    clipboard: Object.hasOwn(patch, 'clipboard') ? (patch.clipboard ?? null) : state.clipboard,
    lastPasteId: Object.hasOwn(patch, 'lastPasteId') ? (patch.lastPasteId ?? null) : state.lastPasteId,
  });
}

/** History snapshots omit canvas background; keep the current fill across undo/redo. */
export function restoreSnapshotKeepingCanvas(
  canvasBackgroundColor: string,
  snapshot: EditorSnapshot,
): EditorSnapshot & { canvasBackgroundColor: string } {
  return {
    ...createSnapshot(snapshot),
    canvasBackgroundColor,
  };
}
