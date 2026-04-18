import {
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { normalizeWheelDelta, type ViewState, zoomAt } from './viewport-math.ts';
import './canvas.css';

// Children that need to convert screen-pixel deltas to world-space (e.g. a
// draggable preview) read the current scale from this context.
const CanvasScaleContext = createContext(1);
export const useCanvasScale = (): number => useContext(CanvasScaleContext);

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  viewX: number;
  viewY: number;
};

type Props = { children: ReactNode };

export function Canvas({ children }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const panRef = useRef<PanState | null>(null);

  // Attach `wheel` via addEventListener so we can preventDefault. React's
  // synthetic onWheel is passive-by-default in React 17+, which would let the
  // browser zoom the page on pinch / Cmd+scroll instead of us handling it.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const { dx, dy } = normalizeWheelDelta(event);
      // Trackpad pinch and Cmd/Ctrl+wheel both surface as wheel events with
      // ctrlKey or metaKey set; everything else is treated as a pan.
      if (event.ctrlKey || event.metaKey) {
        const rect = viewportRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        setView((current) => zoomAt(current, cursor, Math.exp(-dy * 0.01)));
      } else {
        setView((current) => ({ ...current, x: current.x - dx, y: current.y - dy }));
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Only start a pan when the pointerdown is on the viewport background.
    // A pointerdown on a child (e.g. the card) has event.target === child,
    // which stops us from stealing the drag.
    if (event.target !== event.currentTarget) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      viewX: view.x,
      viewY: view.y,
    };
    event.currentTarget.setAttribute('data-panning', 'true');
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    // Pan is 1:1 in screen pixels: the translate is applied before the scale
    // in the transform, so a screen-pixel delta in view.x/y moves the world
    // by a screen pixel at any zoom level.
    setView((current) => ({
      ...current,
      x: pan.viewX + (event.clientX - pan.startX),
      y: pan.viewY + (event.clientY - pan.startY),
    }));
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    panRef.current = null;
    event.currentTarget.removeAttribute('data-panning');
  }

  return (
    <div
      ref={viewportRef}
      className="canvas-viewport"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <div
        className="canvas-world"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        <CanvasScaleContext.Provider value={view.scale}>{children}</CanvasScaleContext.Provider>
      </div>
    </div>
  );
}
