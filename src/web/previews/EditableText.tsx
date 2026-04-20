import {
  type FocusEvent,
  forwardRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
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

  useLayoutEffect(() => {
    useTextEditStore.getState().registerAnchor(anchorKey, () => anchorRef.current);
    return () => {
      useTextEditStore.getState().unregisterAnchor(anchorKey);
    };
  }, [anchorKey]);

  useLayoutEffect(() => {
    if (!openOnMount || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    useEditorStore.getState().setPendingTextEditInstanceId(null);
    if (layerId) {
      useEditorStore.getState().selectLayer(layerSelection(instanceId, layerId));
    } else {
      useEditorStore.getState().select(instanceId);
    }
    useTextEditStore.getState().open({ instanceId, anchorKey, value, multiline, onCommit: onChange });
  }, [openOnMount, instanceId, anchorKey, value, multiline, onChange, layerId]);

  function beginEditing(event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    selectAnchorTarget();
    useTextEditStore.getState().open({ instanceId, anchorKey, value, multiline, onCommit: onChange });
  }

  function selectAnchorTarget() {
    if (layerId) {
      useEditorStore.getState().selectLayer(layerSelection(instanceId, layerId));
      return;
    }
    useEditorStore.getState().select(instanceId);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (event.button !== 0) return;
    selectAnchorTarget();
  }

  function onFocus(event: FocusEvent<HTMLButtonElement>) {
    event.stopPropagation();
    selectAnchorTarget();
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
      onDoubleClick={beginEditing}
      onKeyDown={onTriggerKeyDown}
    >
      {children ?? value}
    </button>
  );
});
