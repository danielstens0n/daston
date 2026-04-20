import { create } from 'zustand';
import { screenToWorld, type ViewState } from '../canvas/viewport-math.ts';

export type WorldRect = { x: number; y: number; width: number; height: number };

export type TextEditSession = {
  instanceId: string;
  anchorKey: string;
  draft: string;
  baseline: string;
  multiline: boolean;
  onCommit: (next: string) => void;
};

type AnchorGetter = () => HTMLElement | null;

type TextEditStore = {
  active: TextEditSession | null;
  registerAnchor: (key: string, getter: AnchorGetter) => void;
  unregisterAnchor: (key: string) => void;
  getAnchor: (key: string) => AnchorGetter | undefined;
  /**
   * Per-instance "primary" edit trigger. Lets wrapper-level double-click
   * share EditableText's anchor + onCommit wiring instead of duplicating it.
   */
  registerBeginEdit: (instanceId: string, fn: () => void) => void;
  unregisterBeginEdit: (instanceId: string, fn: () => void) => void;
  beginPrimaryEdit: (instanceId: string) => void;
  open: (session: Omit<TextEditSession, 'draft' | 'baseline'> & { value: string }) => void;
  setDraft: (draft: string) => void;
  cancel: () => void;
  commit: () => void;
};

const anchorGetters = new Map<string, AnchorGetter>();
const beginEditByInstance = new Map<string, () => void>();

export function elementRectToWorldRect(
  element: HTMLElement,
  viewportEl: HTMLElement,
  view: ViewState,
): WorldRect {
  const vr = viewportEl.getBoundingClientRect();
  const er = element.getBoundingClientRect();
  const left = er.left - vr.left;
  const top = er.top - vr.top;
  const topLeft = screenToWorld({ x: left, y: top }, view);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: er.width / view.scale,
    height: er.height / view.scale,
  };
}

export const useTextEditStore = create<TextEditStore>((set, get) => ({
  active: null,
  registerAnchor: (key, getter) => {
    anchorGetters.set(key, getter);
  },
  unregisterAnchor: (key) => {
    anchorGetters.delete(key);
  },
  getAnchor: (key) => anchorGetters.get(key),
  registerBeginEdit: (instanceId, fn) => {
    beginEditByInstance.set(instanceId, fn);
  },
  unregisterBeginEdit: (instanceId, fn) => {
    // StrictMode double-mount can interleave register/unregister; only clear
    // if we still own the slot.
    if (beginEditByInstance.get(instanceId) === fn) {
      beginEditByInstance.delete(instanceId);
    }
  },
  beginPrimaryEdit: (instanceId) => {
    beginEditByInstance.get(instanceId)?.();
  },
  open: (session) =>
    set({
      active: {
        instanceId: session.instanceId,
        anchorKey: session.anchorKey,
        draft: session.value,
        baseline: session.value,
        multiline: session.multiline,
        onCommit: session.onCommit,
      },
    }),
  setDraft: (draft) => set((state) => (state.active ? { active: { ...state.active, draft } } : state)),
  cancel: () => set({ active: null }),
  commit: () => {
    const { active } = get();
    if (!active) return;
    if (active.draft !== active.baseline) {
      active.onCommit(active.draft);
    }
    set({ active: null });
  },
}));

export function useTextEditActiveForAnchor(anchorKey: string): boolean {
  return useTextEditStore((s) => s.active?.anchorKey === anchorKey);
}

export function useIsTextEditActiveForInstance(instanceId: string): boolean {
  return useTextEditStore((s) => s.active?.instanceId === instanceId);
}
