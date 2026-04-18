import { type PointerEvent, useRef, useState } from 'react';
import { useCanvasScale } from '../canvas/Canvas.tsx';
import './card.css';

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  posX: number;
  posY: number;
};

export function Card() {
  // Pulled from Canvas via context so screen-pixel drag deltas can be
  // converted back to world-space (divide by scale).
  const scale = useCanvasScale();
  const [pos, setPos] = useState({ x: 120, y: 120 });
  const dragRef = useRef<DragState | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Keep this event from reaching the Canvas background pan handler.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    event.currentTarget.setAttribute('data-dragging', 'true');
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    setPos({ x: drag.posX + dx, y: drag.posY + dy });
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.removeAttribute('data-dragging');
  }

  return (
    <div
      className="preview-card"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <h3 className="preview-card-title">Card</h3>
      <p className="preview-card-body">A simple card preview. Drag me around the canvas.</p>
    </div>
  );
}
