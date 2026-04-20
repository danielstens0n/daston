import {
  createContext,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useContextMenuHost } from '../context-menu/ContextMenu.tsx';
import { buildCanvasMenuItems } from '../context-menu/items.ts';
import { TRIANGLE_POLYGON_POINTS } from '../previews/Triangle.tsx';
import type { CanvasTool } from '../state/editor.ts';
import { useEditorStore } from '../state/editor.ts';
import {
  normalizeWheelDelta,
  normalizeWorldRectCorners,
  screenToWorld,
  type ViewState,
  zoomAt,
} from './viewport-math.ts';
import './canvas.css';

const MIN_DRAG_PX = 4;

function isShapeDrawingTool(tool: CanvasTool): tool is Exclude<CanvasTool, 'select'> {
  return tool !== 'select';
}

// Scale value only — pan (`view.x` / `view.y`) does not flow through context,
// so consumers re-render on zoom changes, not on pure translation.
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

type DrawState = {
  pointerId: number;
  tool: Exclude<CanvasTool, 'select'>;
  startX: number;
  startY: number;
};

type RubberBand = {
  tool: Exclude<CanvasTool, 'select'>;
  left: number;
  top: number;
  width: number;
  height: number;
};

type Props = {
  children: ReactNode;
  // Rendered inside the viewport but outside the transformed world, so
  // floating UI (toolbar, selection tools) stays fixed while panning/zooming.
  overlay?: ReactNode;
};

export function Canvas({ children, overlay }: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const { openMenu } = useContextMenuHost();
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 1 });
  const [rubberBand, setRubberBand] = useState<RubberBand | null>(null);

  const viewRef = useRef<ViewState>(view);
  viewRef.current = view;

  const panRef = useRef<PanState | null>(null);
  const drawRef = useRef<DrawState | null>(null);

  const { activeTool, canvasBackgroundColor } = useEditorStore(
    useShallow((s) => ({ activeTool: s.activeTool, canvasBackgroundColor: s.canvasBackgroundColor })),
  );

  const handle = useMemo<CanvasHandle>(
    () => ({
      getView: () => viewRef.current,
      getViewportEl: () => viewportRef.current,
    }),
    [],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const { dx, dy } = normalizeWheelDelta(event);
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

  function viewportPoint(event: PointerEvent<HTMLDivElement>): { x: number; y: number } | null {
    const el = viewportRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (event.target !== event.currentTarget) return;

    const tool = useEditorStore.getState().activeTool;
    if (isShapeDrawingTool(tool)) {
      const p = viewportPoint(event);
      if (!p) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drawRef.current = {
        pointerId: event.pointerId,
        tool,
        startX: p.x,
        startY: p.y,
      };
      setRubberBand({ tool, left: p.x, top: p.y, width: 0, height: 0 });
      event.currentTarget.setAttribute('data-drawing', 'true');
      return;
    }

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
    const draw = drawRef.current;
    if (draw && draw.pointerId === event.pointerId) {
      const p = viewportPoint(event);
      if (!p) return;
      const left = Math.min(draw.startX, p.x);
      const top = Math.min(draw.startY, p.y);
      const width = Math.abs(p.x - draw.startX);
      const height = Math.abs(p.y - draw.startY);
      setRubberBand({ tool: draw.tool, left, top, width, height });
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    setView((current) => ({
      ...current,
      x: pan.viewX + (event.clientX - pan.startX),
      y: pan.viewY + (event.clientY - pan.startY),
    }));
  }

  function finishDraw(event: PointerEvent<HTMLDivElement>) {
    const draw = drawRef.current;
    if (!draw || draw.pointerId !== event.pointerId) return;
    drawRef.current = null;
    event.currentTarget.removeAttribute('data-drawing');
    setRubberBand(null);

    const p = viewportPoint(event);
    const el = viewportRef.current;
    if (!p || !el) return;

    const dx = p.x - draw.startX;
    const dy = p.y - draw.startY;
    const viewNow = viewRef.current;
    const store = useEditorStore.getState();

    if (Math.hypot(dx, dy) < MIN_DRAG_PX) {
      store.addInstance(draw.tool, screenToWorld({ x: p.x, y: p.y }, viewNow));
    } else {
      const w1 = screenToWorld({ x: draw.startX, y: draw.startY }, viewNow);
      const w2 = screenToWorld({ x: p.x, y: p.y }, viewNow);
      store.addInstanceWithRect(draw.tool, normalizeWorldRectCorners(w1, w2));
    }

    store.setActiveTool('select');
    if (draw.tool === 'text') {
      const createdId = store.selectedId;
      if (createdId) {
        store.setPendingTextEditInstanceId(createdId);
      }
    }
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    panRef.current = null;
    event.currentTarget.removeAttribute('data-panning');
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drawRef.current && drawRef.current.pointerId === event.pointerId) {
      finishDraw(event);
      return;
    }
    endPan(event);
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    const draw = drawRef.current;
    if (draw && draw.pointerId === event.pointerId) {
      drawRef.current = null;
      event.currentTarget.removeAttribute('data-drawing');
      setRubberBand(null);
      useEditorStore.getState().setActiveTool('select');
      return;
    }
    endPan(event);
  }

  function onContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    useEditorStore.getState().select(null);
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const worldPoint = screenToWorld(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      viewRef.current,
    );
    openMenu({
      clientX: event.clientX,
      clientY: event.clientY,
      items: buildCanvasMenuItems(worldPoint),
    });
  }

  const showOverlayShell = Boolean(overlay || rubberBand);

  return (
    <CanvasHandleContext.Provider value={handle}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: viewport handles pan + canvas context menu */}
      <div
        ref={viewportRef}
        className="canvas-viewport"
        style={{ background: canvasBackgroundColor }}
        data-active-tool={activeTool !== 'select' ? activeTool : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={onContextMenu}
      >
        <div
          className="canvas-world"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <CanvasScaleContext.Provider value={view.scale}>{children}</CanvasScaleContext.Provider>
        </div>
        {showOverlayShell ? (
          <div className="canvas-overlay">
            {rubberBand ? <RubberBandPreview band={rubberBand} /> : null}
            {overlay}
          </div>
        ) : null}
      </div>
    </CanvasHandleContext.Provider>
  );
}

// Triangle uses SVG because CSS dashed borders can't follow a clip-path.
function RubberBandPreview({ band }: { band: RubberBand }) {
  const style = {
    left: band.left,
    top: band.top,
    width: band.width,
    height: band.height,
  };
  if (band.tool === 'triangle') {
    return (
      <div className="canvas-rubber-band" data-tool="triangle" style={style}>
        <svg className="canvas-rubber-band-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <title>Triangle preview</title>
          <polygon className="canvas-rubber-band-polygon" points={TRIANGLE_POLYGON_POINTS} />
        </svg>
      </div>
    );
  }
  return <div className="canvas-rubber-band" data-tool={band.tool} style={style} />;
}
