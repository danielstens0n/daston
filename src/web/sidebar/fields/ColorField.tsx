import { type ChangeEvent, type KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';
import { ColorPicker } from './color-picker/ColorPicker.tsx';
import { ColorPickerProvider } from './color-picker/ColorPickerContext.tsx';
import { HEX_6_OR_8_RE } from './color-picker/color-math.ts';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ColorField({ value, onChange }: Props) {
  const swatchRef = useRef<HTMLButtonElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Draft hex + sync from `value` on external updates (render, not effect).
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setDraft(value);
  }

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const onPickerChange = useCallback(
    (next: string) => {
      setDraft(next);
      onChange(next);
    },
    [onChange],
  );

  function onTextChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);
    if (HEX_6_OR_8_RE.test(next)) onChange(next.toLowerCase());
  }

  function onBlur() {
    if (HEX_6_OR_8_RE.test(draft)) onChange(draft.toLowerCase());
    else setDraft(value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setDraft(value);
      event.currentTarget.blur();
    }
  }

  function onSwatchClick() {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    const el = swatchRef.current;
    if (el) setAnchorRect(el.getBoundingClientRect());
    setPickerOpen(true);
  }

  const pickerSession = useMemo(
    () => (anchorRect ? { value, onChange: onPickerChange, onClose: closePicker, anchorRect } : null),
    [anchorRect, closePicker, onPickerChange, value],
  );

  return (
    <div className="sidebar-color-field">
      <button
        ref={swatchRef}
        className="sidebar-color-swatch"
        style={{ background: value }}
        type="button"
        aria-label="Open color picker"
        aria-expanded={pickerOpen}
        data-color-picker-anchor
        onClick={onSwatchClick}
      />
      <input
        className="sidebar-color-hex"
        type="text"
        value={draft}
        onChange={onTextChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        spellCheck={false}
      />
      {pickerOpen && pickerSession ? (
        <ColorPickerProvider session={pickerSession}>
          <ColorPicker />
        </ColorPickerProvider>
      ) : null}
    </div>
  );
}
