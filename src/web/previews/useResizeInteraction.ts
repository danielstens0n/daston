import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { useCanvasScale } from '../canvas/Canvas.tsx';
import { useEditorStore } from '../state/editor.ts';

// Which corner of the preview's bounding box is being dragged. Each corner
// mutates a different subset of x/y/width/height — see resizeRect.
export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

export type ResizeRect = { x: number; y: number; width: number; height: number };

// Minimum drag dimension. The store applies its own floor as defense in
// depth; keeping one here lets the hook pin the opposite corner correctly,
// which the store can't do (it doesn't know which corner is being dragged).
const MIN_SIZE = 40;

type DragState = {
  pointerId: number;
  lastClientX: number;
  lastClientY: number;
  // Running rect in world-space. Same pattern as useInstanceInteraction —
  // accumulate per-frame deltas on the ref so zoom mid-drag doesn't rescale
  // travel that already happened at the previous zoom.
  rect: ResizeRect;
};

// Apply a world-space delta to a corner and return the new rect. Pure.
// The key invariant: the *opposite* corner of the one being dragged does not
// move. When the drag would shrink past MIN_SIZE, the dragged corner pins
// at MIN_SIZE away from the anchor instead of continuing to slide.
export function resizeRect(rect: ResizeRect, corner: ResizeCorner, dx: number, dy: number): ResizeRect {
  switch (corner) {
    case 'se':
      return {
        x: rect.x,
        y: rect.y,
        width: Math.max(MIN_SIZE, rect.width + dx),
        height: Math.max(MIN_SIZE, rect.height + dy),
      };
    case 'sw': {
      const anchorX = rect.x + rect.width;
      const newX = Math.min(rect.x + dx, anchorX - MIN_SIZE);
      return {
        x: newX,
        y: rect.y,
        width: anchorX - newX,
        height: Math.max(MIN_SIZE, rect.height + dy),
      };
    }
    case 'ne': {
      const anchorY = rect.y + rect.height;
      const newY = Math.min(rect.y + dy, anchorY - MIN_SIZE);
      return {
        x: rect.x,
        y: newY,
        width: Math.max(MIN_SIZE, rect.width + dx),
        height: anchorY - newY,
      };
    }
    case 'nw': {
      const anchorX = rect.x + rect.width;
      const anchorY = rect.y + rect.height;
      const newX = Math.min(rect.x + dx, anchorX - MIN_SIZE);
      const newY = Math.min(rect.y + dy, anchorY - MIN_SIZE);
      return {
        x: newX,
        y: newY,
        width: anchorX - newX,
        height: anchorY - newY,
      };
    }
  }
}

// Drag-to-resize for any preview, keyed by id and corner. Modeled on
// useInstanceInteraction: subscribes to scale (reactive), reads the live
// instance at pointerdown via getState(), and writes every frame via
// store.resize.
export function useResizeInteraction(id: string, corner: ResizeCorner) {
  const scale = useCanvasScale();
  const dragRef = useRef<DragState | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Prevent the wrapper's drag handler (and the canvas pan) from starting
    // underneath. The handle is a child of the wrapper, so its pointerdown
    // would otherwise bubble into the wrapper's drag.
    event.stopPropagation();
    const store = useEditorStore.getState();
    const instance = store.instances.find((i) => i.id === id);
    if (!instance) return;
    store.select(id);
    store.beginHistoryBatch();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      rect: {
        x: instance.x,
        y: instance.y,
        width: instance.width,
        height: instance.height,
      },
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.lastClientX) / scale;
    const dy = (event.clientY - drag.lastClientY) / scale;
    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;
    drag.rect = resizeRect(drag.rect, corner, dx, dy);
    useEditorStore.getState().resize(id, drag.rect);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    useEditorStore.getState().endHistoryBatch();
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
