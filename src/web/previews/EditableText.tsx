import { type KeyboardEvent, type MouseEvent, useId, useLayoutEffect, useRef } from 'react';
import { useTextEditActiveForAnchor, useTextEditStore } from '../state/text-edit.ts';
import './editable-text.css';

type Props = {
  instanceId: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
};

export function EditableText({ instanceId, value, onChange, className, multiline = false }: Props) {
  const anchorKey = useId();
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const isAnchorActive = useTextEditActiveForAnchor(anchorKey);

  useLayoutEffect(() => {
    useTextEditStore.getState().registerAnchor(anchorKey, () => anchorRef.current);
    return () => {
      useTextEditStore.getState().unregisterAnchor(anchorKey);
    };
  }, [anchorKey]);

  function beginEditing(event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    useTextEditStore.getState().open({ instanceId, anchorKey, value, multiline, onCommit: onChange });
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    beginEditing(event);
  }

  return (
    <button
      ref={anchorRef}
      type="button"
      data-preview-interactive="true"
      className={className ?? 'preview-inline-text'}
      style={{ visibility: isAnchorActive ? 'hidden' : 'visible' }}
      onDoubleClick={beginEditing}
      onKeyDown={onTriggerKeyDown}
    >
      {value}
    </button>
  );
}
