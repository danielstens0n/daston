import {
  type FocusEvent,
  forwardRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
} from 'react';
import { useInstanceId } from '../canvas/InstanceIdContext.tsx';
import { useEditorStore } from '../state/editor.ts';
import { layerSelection } from '../state/layers.ts';
import { useTextEditActiveForAnchor, useTextEditStore } from '../state/text-edit.ts';
import './editable-text.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  layerId?: string;
  /** Open the inline editor once after mount (e.g. new text from the draw tool). */
  openOnMount?: boolean;
  /** Read-only display; defaults to `value`. */
  children?: ReactNode;
};

export const EditableText = forwardRef<HTMLButtonElement, Props>(function EditableText(
  { value, onChange, className, multiline = false, layerId, openOnMount = false, children },
  ref,
) {
  const instanceId = useInstanceId();
  const anchorKey = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const autoOpenedRef = useRef(false);
  const isAnchorActive = useTextEditActiveForAnchor(anchorKey);
  // Narrow subscription: true when *this* anchor matches the editor's
  // selected target. Inline to avoid allocating a fresh `layerSelection`
  // object on every store update — this selector runs once per anchor per
  // mutation, and Landing/Table instances have many anchors.
  const isAnchorSelected = useEditorStore((state) => {
    const t = state.selectedTarget;
    if (!t || t.instanceId !== instanceId) return false;
    return layerId ? t.kind === 'layer' && t.layerId === layerId : t.kind === 'instance';
  });

  useLayoutEffect(() => {
    useTextEditStore.getState().registerAnchor(anchorKey, () => anchorRef.current);
    return () => {
      useTextEditStore.getState().unregisterAnchor(anchorKey);
    };
  }, [anchorKey]);

  function selectAnchorTarget() {
    const store = useEditorStore.getState();
    if (layerId) store.selectLayer(layerSelection(instanceId, layerId));
    else store.select(instanceId);
  }

  const beginEditing = useCallback(
    (event?: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      const store = useEditorStore.getState();
      if (layerId) store.selectLayer(layerSelection(instanceId, layerId));
      else store.select(instanceId);
      useTextEditStore.getState().open({ instanceId, anchorKey, value, multiline, onCommit: onChange });
    },
    [instanceId, anchorKey, value, multiline, onChange, layerId],
  );

  useLayoutEffect(() => {
    if (!openOnMount || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    useEditorStore.getState().setPendingTextEditInstanceId(null);
    beginEditing();
  }, [openOnMount, beginEditing]);

  // Expose this anchor as the instance's primary edit entry point so the
  // wrapper's double-click handler can route to the same code path when the
  // user double-clicks the wrapper outside the button itself.
  useLayoutEffect(() => {
    const fn = () => beginEditing();
    useTextEditStore.getState().registerBeginEdit(instanceId, fn);
    return () => {
      useTextEditStore.getState().unregisterBeginEdit(instanceId, fn);
    };
  }, [instanceId, beginEditing]);

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (event.button !== 0) return;
    selectAnchorTarget();
  }

  function onFocus(event: FocusEvent<HTMLButtonElement>) {
    event.stopPropagation();
    selectAnchorTarget();
  }

  function onDoubleClick(event: MouseEvent<HTMLButtonElement>) {
    // Figma's click-to-select / double-click-to-edit split: require the
    // anchor to already be the selected target before opening the editor.
    if (!isAnchorSelected) {
      event.stopPropagation();
      return;
    }
    beginEditing(event);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    beginEditing(event);
  }

  const anchorClass = `${className ?? 'preview-inline-text'} preview-editable-text-anchor`;

  function setRefs(el: HTMLButtonElement | null) {
    anchorRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }

  return (
    <button
      ref={setRefs}
      type="button"
      data-preview-interactive="true"
      className={anchorClass}
      style={{ visibility: isAnchorActive ? 'hidden' : 'visible' }}
      onPointerDown={onPointerDown}
      onFocus={onFocus}
      onDoubleClick={onDoubleClick}
      onKeyDown={onTriggerKeyDown}
    >
      {children ?? value}
    </button>
  );
});
