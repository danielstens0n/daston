import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { useEditorStore, useIsSelected } from '../state/editor.ts';
import { ancestorChain, childOfRootOnPath, pickDropTarget } from '../state/hierarchy.ts';
import { useTextEditStore } from '../state/text-edit.ts';
import type { ComponentInstance } from '../state/types.ts';
import { useCanvasScale } from './Canvas.tsx';

// Tracks the last pointer position + running world position so each frame's
// screen→world conversion uses the *current* scale. Total-delta-over-scale
// math would misattribute pre-zoom travel to the new scale.
type DragState = {
  pointerId: number;
  lastClientX: number;
  lastClientY: number;
  unconstrainedX: number;
  unconstrainedY: number;
  originWorldX: number;
  originWorldY: number;
  targetId: string;
  altDuplicated: boolean;
  dropTargetId: string | null;
};

export const SHIFT_AXIS_LOCK_THRESHOLD_PX = 4;

/** Shift-axis lock from drag origin; re-evaluate shiftKey every frame. */
export function constrainedDragPosition(
  originX: number,
  originY: number,
  unconstrainedX: number,
  unconstrainedY: number,
  shiftKey: boolean,
  threshold: number,
): { x: number; y: number } {
  if (!shiftKey) {
    return { x: unconstrainedX, y: unconstrainedY };
  }
  const dx = unconstrainedX - originX;
  const dy = unconstrainedY - originY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) {
    return { x: unconstrainedX, y: unconstrainedY };
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: unconstrainedX, y: originY };
  }
  return { x: originX, y: unconstrainedY };
}

/**
 * Figma-style drill-down resolution. Walks the hit's ancestor chain once
 * and decides, given the current "entered" container (`selectionRootId`),
 * which instance should become the selected/drag target and whether the
 * selection root should be cleared.
 */
export function resolveDrillTarget(
  instances: readonly ComponentInstance[],
  hitId: string,
  selectionRootId: string | null,
): { targetId: string; clearSelectionRoot: boolean } {
  const chain = ancestorChain(instances, hitId);
  const outermost = chain[chain.length - 1] ?? hitId;
  if (!selectionRootId) return { targetId: outermost, clearSelectionRoot: false };
  const rootIndex = chain.indexOf(selectionRootId);
  if (rootIndex < 0) return { targetId: outermost, clearSelectionRoot: true };
  if (rootIndex === 0) return { targetId: hitId, clearSelectionRoot: false };
  return { targetId: chain[rootIndex - 1] ?? hitId, clearSelectionRoot: false };
}

// Drag + select for any preview, keyed by id. The hook subscribes only to
// `isSelected` (reactive) and reads the live position from the store at
// pointerdown via `getState()` so dragging doesn't re-subscribe the caller
// on every frame.
export function useInstanceInteraction(id: string) {
  const scale = useCanvasScale();
  const isSelected = useIsSelected(id);
  const dragRef = useRef<DragState | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const store = useEditorStore.getState();
    const { targetId, clearSelectionRoot } = resolveDrillTarget(store.instances, id, store.selectionRootId);
    if (clearSelectionRoot) store.setSelectionRootId(null);
    store.select(targetId);

    if (isInteractiveTarget(event.target)) return;
    const dragInstance = store.instances.find((i) => i.id === targetId);
    if (!dragInstance) return;

    store.beginHistoryBatch();
    event.currentTarget.setPointerCapture(event.pointerId);

    let dragTargetId = targetId;
    let altDuplicated = false;
    if (event.altKey) {
      const cloneId = store.duplicateInPlaceForDrag(dragTargetId);
      if (!cloneId) {
        store.endHistoryBatch();
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      dragTargetId = cloneId;
      altDuplicated = true;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      unconstrainedX: dragInstance.x,
      unconstrainedY: dragInstance.y,
      originWorldX: dragInstance.x,
      originWorldY: dragInstance.y,
      targetId: dragTargetId,
      altDuplicated,
      dropTargetId: null,
    };
    event.currentTarget.setAttribute('data-dragging', 'true');
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const store = useEditorStore.getState();
    // Per-frame delta divided by the current scale. Accumulated world
    // position lives on dragRef so we don't re-read a stale instance.x/y.
    drag.unconstrainedX += (event.clientX - drag.lastClientX) / scale;
    drag.unconstrainedY += (event.clientY - drag.lastClientY) / scale;
    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;

    if (event.altKey && !drag.altDuplicated) {
      const cloneId = store.duplicateInPlaceForDrag(drag.targetId);
      if (cloneId) {
        drag.targetId = cloneId;
        drag.altDuplicated = true;
      }
    }

    const { x, y } = constrainedDragPosition(
      drag.originWorldX,
      drag.originWorldY,
      drag.unconstrainedX,
      drag.unconstrainedY,
      event.shiftKey,
      SHIFT_AXIS_LOCK_THRESHOLD_PX,
    );

    store.move(drag.targetId, { x, y });

    // Preview the parent the drop will land in; the actual reparent happens
    // on pointerup so mid-drag overlaps don't churn history.
    const after = useEditorStore.getState();
    const moved = after.instances.find((candidate) => candidate.id === drag.targetId);
    if (moved) {
      const targetParent = pickDropTarget(after.instances, moved.id, moved);
      if (drag.dropTargetId !== targetParent) {
        drag.dropTargetId = targetParent;
        after.setDropTargetId(targetParent);
      }
    }
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    const store = useEditorStore.getState();
    const moved = store.instances.find((candidate) => candidate.id === drag.targetId);
    if (moved && moved.parentId !== drag.dropTargetId) {
      store.setParent(moved.id, drag.dropTargetId);
    }
    store.setDropTargetId(null);
    store.endHistoryBatch();
    event.currentTarget.removeAttribute('data-dragging');
  }

  function onDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    const store = useEditorStore.getState();
    const hit = store.instances.find((i) => i.id === id);
    if (!hit) return;
    event.stopPropagation();

    // Figma parity: double-click on an already-selected text opens the inline
    // editor (via EditableText's registered entry point, sharing its anchor
    // + onCommit wiring); double-click on an already-selected container
    // "enters" it, after which single clicks select the direct child on the
    // hit path.
    if (hit.type === 'text' && store.selectedId === id) {
      useTextEditStore.getState().beginPrimaryEdit(id);
      return;
    }

    const chain = ancestorChain(store.instances, id);
    const selectedId = store.selectedId;
    if (!selectedId || !chain.includes(selectedId)) return;
    if (!store.instances.some((i) => i.parentId === selectedId)) return;

    store.setSelectionRootId(selectedId);
    if (selectedId !== id) {
      const child = childOfRootOnPath(store.instances, selectedId, id);
      if (child) store.select(child);
    }
  }

  return {
    isSelected,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onDoubleClick,
    },
  };
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[data-preview-interactive="true"]') !== null;
}
