import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { useCanvasScale } from '../canvas/Canvas.tsx';
import { useEditorStore, useIsSelected } from '../state/editor.ts';
import type { ComponentInstance } from '../state/types.ts';

// Tracks the last pointer position + running world position so each frame's
// screen→world conversion uses the *current* scale. If a user pinch-zooms
// mid-drag, per-frame deltas stay correct (total-delta-over-scale math would
// misattribute pre-zoom travel to the new scale).
type DragState = {
  pointerId: number;
  lastClientX: number;
  lastClientY: number;
  worldX: number;
  worldY: number;
};

// Shared interaction for any preview on the canvas: pointerdown selects and
// starts a drag; pointermove accumulates world-space deltas; pointerup ends
// the gesture. Each preview wires the returned handlers onto its root.
export function useInstanceInteraction(instance: ComponentInstance) {
  const scale = useCanvasScale();
  const isSelected = useIsSelected(instance.id);
  const dragRef = useRef<DragState | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Prevent the canvas pan handler from starting a pan under this element.
    event.stopPropagation();
    useEditorStore.getState().select(instance.id);
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
    // position lives on dragRef so we don't re-read instance.x/y (which
    // comes from React props and would lag by a render).
    drag.worldX += (event.clientX - drag.lastClientX) / scale;
    drag.worldY += (event.clientY - drag.lastClientY) / scale;
    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;
    useEditorStore.getState().move(instance.id, { x: drag.worldX, y: drag.worldY });
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
