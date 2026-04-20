import type { RefObject } from 'react';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MIN_SIZE } from './mutations.ts';
import { useEditorStore } from './store.ts';

const TEXT_PREVIEW_PAD_X = 12;
const TEXT_PREVIEW_PAD_Y = 8;

export type ResizeLockedAxes = { lockWidth: boolean; lockHeight: boolean };

const NO_RESIZE_LOCKS: ResizeLockedAxes = Object.freeze({ lockWidth: false, lockHeight: false });

export function useResizeLockedAxes(id: string): ResizeLockedAxes {
  return useEditorStore(
    useShallow((state) => {
      const inst = state.instances.find((i) => i.id === id);
      if (!inst || inst.type !== 'text') return NO_RESIZE_LOCKS;
      const mode = inst.props.textAutoResize;
      if (mode === 'fixed') return NO_RESIZE_LOCKS;
      return {
        lockWidth: mode === 'width',
        lockHeight: mode === 'height',
      };
    }),
  );
}

export function useTextAutoResize(id: string, measureRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    function measureAndMaybeResize() {
      const node = measureRef.current;
      if (!node) return;
      const store = useEditorStore.getState();
      const inst = store.instances.find((i) => i.id === id);
      if (!inst || inst.type !== 'text') return;
      const mode = inst.props.textAutoResize;
      if (mode === 'fixed') return;

      const w = Math.max(MIN_SIZE, Math.ceil(node.scrollWidth) + TEXT_PREVIEW_PAD_X);
      const h = Math.max(MIN_SIZE, Math.ceil(node.scrollHeight) + TEXT_PREVIEW_PAD_Y);

      if (mode === 'width' && Math.abs(inst.width - w) > 0.5) {
        store.resize(id, { x: inst.x, y: inst.y, width: w, height: inst.height });
        return;
      }
      if (mode === 'height' && Math.abs(inst.height - h) > 0.5) {
        store.resize(id, { x: inst.x, y: inst.y, width: inst.width, height: h });
      }
    }

    const ro = new ResizeObserver(() => {
      measureAndMaybeResize();
    });
    ro.observe(el);
    measureAndMaybeResize();
    return () => {
      ro.disconnect();
    };
  }, [id, measureRef]);
}
