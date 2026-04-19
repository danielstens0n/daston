import { type ChangeEvent, type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from 'react';
import './editable-text.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
};

type EditableElement = HTMLInputElement | HTMLTextAreaElement;

export function EditableText({ value, onChange, className, inputClassName, multiline = false }: Props) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const ignoreBlurRef = useRef(false);
  const inputRef = useRef<EditableElement | null>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [isEditing, value]);

  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    resizeMultilineEditor(inputRef.current, multiline, draft);
  }, [draft, isEditing, multiline]);

  function startEditing(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDraft(value);
    setIsEditing(true);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    ignoreBlurRef.current = false;
    setIsEditing(false);
    if (draft !== value) onChange(draft);
  }

  function cancel() {
    ignoreBlurRef.current = true;
    setDraft(value);
    setIsEditing(false);
  }

  return isEditing ? (
    renderEditor()
  ) : (
    <button
      type="button"
      data-preview-interactive="true"
      className={className ?? 'preview-inline-text'}
      onDoubleClick={startEditing}
      onKeyDown={onTriggerKeyDown}
    >
      {value}
    </button>
  );

  function renderEditor() {
    const sharedProps = {
      'data-preview-interactive': 'true',
      className: inputClassName ?? 'preview-inline-text-input',
      value: draft,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
      onBlur: () => {
        if (ignoreBlurRef.current) {
          ignoreBlurRef.current = false;
          return;
        }
        commit();
      },
      onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          cancel();
        }
      },
    };

    if (multiline) {
      return (
        <textarea
          {...sharedProps}
          ref={(element) => {
            inputRef.current = element;
          }}
          rows={1}
        />
      );
    }

    return (
      <input
        {...sharedProps}
        ref={(element) => {
          inputRef.current = element;
        }}
        type="text"
      />
    );
  }
}

function resizeMultilineEditor(element: EditableElement | null, multiline: boolean, _value: string) {
  if (!multiline || !(element instanceof HTMLTextAreaElement)) return;
  element.style.height = '0px';
  element.style.height = `${element.scrollHeight}px`;
}
