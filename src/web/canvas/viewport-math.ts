// Pure helpers for the canvas viewport transform. Kept separate from Canvas.tsx
// so the math (which is the subtle part) can be unit-tested without React.

export type ViewState = { x: number; y: number; scale: number };

export type ViewportPoint = { x: number; y: number };

const DEFAULT_MIN_ZOOM = 0.1;
const DEFAULT_MAX_ZOOM = 4;

export function clampScale(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Zoom anchored at the cursor: the world point under the cursor before the zoom
// stays under the cursor after. With transform `translate(x,y) scale(s)`, the
// screen→world mapping is worldP = (cursorP - viewP) / s. After scaling to s',
// we pick (x', y') so (cursorP) still maps back to the same worldP.
export function zoomAt(
  view: ViewState,
  cursor: ViewportPoint,
  factor: number,
  min: number = DEFAULT_MIN_ZOOM,
  max: number = DEFAULT_MAX_ZOOM,
): ViewState {
  const scale = clampScale(view.scale * factor, min, max);
  if (scale === view.scale) return view;
  const worldX = (cursor.x - view.x) / view.scale;
  const worldY = (cursor.y - view.y) / view.scale;
  return {
    scale,
    x: cursor.x - worldX * scale,
    y: cursor.y - worldY * scale,
  };
}

// Browsers report wheel deltas in pixels, lines, or pages depending on the
// input device. We need pixel-scale numbers for pan/zoom; normalize here so
// the handler can stay simple. Constants are rough conventions — the exact
// multiplier doesn't matter as long as line/page deltas feel proportional to
// pixel deltas.
export function normalizeWheelDelta(event: WheelEvent): { dx: number; dy: number } {
  const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
  return { dx: event.deltaX * multiplier, dy: event.deltaY * multiplier };
}
