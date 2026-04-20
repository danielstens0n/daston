import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { useEditorStore, useIsSelected } from '../state/editor.ts';
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
    // Prevent the canvas pan handler from starting a pan under this element.
    event.stopPropagation();
    const store = useEditorStore.getState();
    const instance = store.instances.find((i) => i.id === id);
    if (!instance) return;
    store.select(id);
    if (isInteractiveTarget(event.target)) return;
    store.beginHistoryBatch();
    event.currentTarget.setPointerCapture(event.pointerId);

    let targetId = id;
    let altDuplicated = false;
    if (event.altKey) {
      const cloneId = store.duplicateInPlaceForDrag(id);
      if (!cloneId) {
        store.endHistoryBatch();
        event.currentTarget.releasePointerCapture(event.pointerId);
        return;
      }
      targetId = cloneId;
      altDuplicated = true;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      unconstrainedX: instance.x,
      unconstrainedY: instance.y,
      originWorldX: instance.x,
      originWorldY: instance.y,
      targetId,
      altDuplicated,
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
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    useEditorStore.getState().endHistoryBatch();
    event.currentTarget.removeAttribute('data-dragging');
  }

  return {
    isSelected,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[data-preview-interactive="true"]') !== null;
}
