import { type ChangeEvent, type KeyboardEvent, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

// Accept 6-char hex (#rrggbb) and 8-char hex (#rrggbbaa). The native color
// picker only speaks 6-char hex, so picking via the swatch drops any alpha —
// users who want alpha enter the 8-char form in the text field.
const HEX_RE = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

export function ColorField({ value, onChange }: Props) {
  // Draft lets the user type incomplete/invalid hex without snapping back.
  // External `value` changes (theme swap, reset) are synced during render —
  // not in an effect — per React's "adjusting state on prop change" guide.
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setDraft(value);
  }

  function onTextChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);
    // Live-commit when the draft is a valid hex. Keeps preview feedback
    // instant; blur/Enter canonicalizes or reverts.
    if (HEX_RE.test(next)) onChange(next.toLowerCase());
  }

  function onBlur() {
    if (HEX_RE.test(draft)) onChange(draft.toLowerCase());
    else setDraft(value);
  }

  function onPickerChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);
    onChange(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setDraft(value);
      event.currentTarget.blur();
    }
  }

  // The picker only understands 6-char hex — strip any alpha suffix for its
  // value so it opens on the correct swatch.
  const pickerValue = value.length >= 7 ? value.slice(0, 7) : value;

  return (
    <div className="sidebar-color-field">
      <button
        className="sidebar-color-swatch"
        style={{ background: value }}
        type="button"
        aria-label="Open color picker"
      >
        <input type="color" value={pickerValue} onChange={onPickerChange} />
      </button>
      <input
        className="sidebar-color-hex"
        type="text"
        value={draft}
        onChange={onTextChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        spellCheck={false}
      />
    </div>
  );
}
