import {
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useEditorStore } from '../state/editor.ts';
import { normalizeWheelDelta, type ViewState, zoomAt } from './viewport-math.ts';
import './canvas.css';

// Children that need to convert screen-pixel deltas to world-space (e.g. a
// draggable preview) read the current scale from this context. Separate from
// the handle context below so scale-only consumers re-render on zoom but not
// on pan.
const CanvasScaleContext = createContext(1);
export const useCanvasScale = (): number => useContext(CanvasScaleContext);

// Stable handle for click-time reads of the viewport. Returns functions that
// close over refs, so the context value itself never changes — consumers like
// the floating toolbar subscribe once and never re-render from pan/zoom.
export type CanvasHandle = {
  getView: () => ViewState;
  getViewportEl: () => HTMLDivElement | null;
};
const CanvasHandleContext = createContext<CanvasHandle | null>(null);
export function useCanvasHandle(): CanvasHandle {
  const handle = useContext(CanvasHandleContext);
  if (!handle) throw new Error('useCanvasHandle must be used inside <Canvas>');
  return handle;
}

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  viewX: number;
  viewY: number;
};

type Props = {
  children: ReactNode;
  // Rendered inside the viewport but outside the transformed world, so
  // floating UI (toolbar, selection tools) stays fixed while panning/zooming.
  overlay?: ReactNode;
};

export function Canvas({ children, overlay }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });

  // Mirror the view state into a ref so the handle can read the latest value
  // at click time without re-subscribing consumers on every frame. Assigned
  // in render (not in an effect) because it's pure derived state.
  const viewRef = useRef<ViewState>(view);
  viewRef.current = view;

  const panRef = useRef<PanState | null>(null);

  const handle = useMemo<CanvasHandle>(
    () => ({
      getView: () => viewRef.current,
      getViewportEl: () => viewportRef.current,
    }),
    [],
  );

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
    // Clicking empty canvas deselects. getState() avoids subscribing Canvas
    // to store changes — it only writes.
    useEditorStore.getState().select(null);
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
    <CanvasHandleContext.Provider value={handle}>
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
        {overlay ? <div className="canvas-overlay">{overlay}</div> : null}
      </div>
    </CanvasHandleContext.Provider>
  );
}
