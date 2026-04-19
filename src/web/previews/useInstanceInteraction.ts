import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { useCanvasScale } from '../canvas/Canvas.tsx';
import { useEditorStore, useIsSelected } from '../state/editor.ts';

// Tracks the last pointer position + running world position so each frame's
// screen→world conversion uses the *current* scale. Total-delta-over-scale
// math would misattribute pre-zoom travel to the new scale.
type DragState = {
  pointerId: number;
  lastClientX: number;
  lastClientY: number;
  worldX: number;
  worldY: number;
};

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
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      worldX: instance.x,
      worldY: instance.y,
    };
    event.currentTarget.setAttribute('data-dragging', 'true');
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    // Per-frame delta divided by the current scale. Accumulated world
    // position lives on dragRef so we don't re-read a stale instance.x/y.
    drag.worldX += (event.clientX - drag.lastClientX) / scale;
    drag.worldY += (event.clientY - drag.lastClientY) / scale;
    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;
    useEditorStore.getState().move(id, { x: drag.worldX, y: drag.worldY });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
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
