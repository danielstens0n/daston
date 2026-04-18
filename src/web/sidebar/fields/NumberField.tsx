import { type ChangeEvent, type KeyboardEvent, useState } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

// Draft-state number input. User edits freely; parseable values commit live
// (no clamping during typing — that would fight negative intermediate states
// like "-" before the digit). Blur/Enter canonicalizes and clamps. External
// `value` changes are synced during render per React's adjust-state guide.
export function NumberField({ value, onChange, min, max, step = 1, unit }: Props) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setDraft(String(value));
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);
    const parsed = Number(next);
    if (Number.isFinite(parsed)) onChange(parsed);
  }

  function onBlur() {
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      const clamped = clamp(parsed, min, max);
      if (clamped !== value) onChange(clamped);
      setDraft(String(clamped));
    } else {
      setDraft(String(value));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      setDraft(String(value));
      event.currentTarget.blur();
    }
  }

  return (
    <div className="sidebar-number-field">
      <input
        type="number"
        value={draft}
        onChange={onInputChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        min={min}
        max={max}
        step={step}
      />
      {unit ? <span>{unit}</span> : null}
    </div>
  );
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}
