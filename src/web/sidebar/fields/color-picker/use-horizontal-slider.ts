import type { PointerEvent as ReactPointerEvent } from 'react';
import { type RefObject, useCallback } from 'react';
import { clamp01 } from './color-math.ts';

export function releasePointerIfCaptured(e: ReactPointerEvent<HTMLDivElement>): void {
  const t = e.currentTarget;
  if (t.hasPointerCapture(e.pointerId)) {
    t.releasePointerCapture(e.pointerId);
  }
}

/**
 * Horizontal 0–1 track: pointerdown/move with capture, `commitNorm` receives
 * x position normalized by track width (clamped).
 */
export function useHorizontalSlider(
  trackRef: RefObject<HTMLDivElement | null>,
  commitNorm: (norm: number) => void,
): {
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: typeof releasePointerIfCaptured;
  onPointerCancel: typeof releasePointerIfCaptured;
} {
  const readNorm = useCallback(
    (clientX: number): number | null => {
      const el = trackRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return clamp01((clientX - rect.left) / rect.width);
    },
    [trackRef],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const n = readNorm(e.clientX);
      if (n === null) return;
      commitNorm(n);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [readNorm, commitNorm],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const n = readNorm(e.clientX);
      if (n === null) return;
      commitNorm(n);
    },
    [readNorm, commitNorm],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: releasePointerIfCaptured,
    onPointerCancel: releasePointerIfCaptured,
  };
}
