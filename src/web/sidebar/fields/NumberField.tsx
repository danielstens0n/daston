import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal, flushSync } from 'react-dom';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

const MAX_PRESETS = 24;
const MENU_MAX_HEIGHT_PX = 220;

// Draft-state number input. User edits freely; parseable values commit live
// (no clamping during typing — that would fight negative intermediate states
// like "-" before the digit). Blur/Enter canonicalizes and clamps. External
// `value` changes are synced during render per React's adjust-state guide.
export function NumberField({ value, onChange, min, max, step = 1, unit }: Props) {
  const [draft, setDraft] = useState(formatDisplay(value));
  const [lastValue, setLastValue] = useState(value);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  if (lastValue !== value) {
    setLastValue(value);
    setDraft(formatDisplay(value));
  }

  const presets = derivePresets(min, max, step, value);
  const highlightValue = Number.isFinite(Number(draft)) ? clamp(Number(draft), min, max) : value;

  useLayoutEffect(() => {
    if (!open) return;
    const inputEl = inputRef.current;
    if (!inputEl) return;
    const el = inputEl;

    function updatePosition() {
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const placeAbove = spaceBelow < MENU_MAX_HEIGHT_PX + 8 && r.top > MENU_MAX_HEIGHT_PX + 8;
      const top = placeAbove ? r.top - MENU_MAX_HEIGHT_PX - 4 : r.bottom + 4;
      setMenuStyle({
        position: 'fixed',
        left: r.left,
        width: r.width,
        top: Math.max(8, Math.min(top, window.innerHeight - MENU_MAX_HEIGHT_PX - 8)),
        maxHeight: MENU_MAX_HEIGHT_PX,
        zIndex: 10_000,
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(event: PointerEvent) {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [open]);

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
      setDraft(formatDisplay(clamped));
    } else {
      setDraft(formatDisplay(value));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    } else if (event.key === 'Escape') {
      if (open) {
        setOpen(false);
      } else {
        flushSync(() => {
          setDraft(formatDisplay(value));
        });
        event.currentTarget.blur();
      }
    }
  }

  function applyPreset(n: number) {
    const next = clamp(n, min, max);
    onChange(next);
    setDraft(formatDisplay(next));
    setOpen(false);
    inputRef.current?.focus();
  }

  const menu =
    open && presets.length > 0 ? (
      <div
        ref={menuRef}
        className="sidebar-number-field-menu"
        style={menuStyle}
        role="listbox"
        aria-label="Presets"
      >
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            className={
              Math.abs(n - highlightValue) < 1e-9
                ? 'sidebar-number-preset-item sidebar-number-preset-item-active'
                : 'sidebar-number-preset-item'
            }
            role="option"
            aria-selected={Math.abs(n - highlightValue) < 1e-9}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => applyPreset(n)}
          >
            {formatPreset(n)}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={open ? 'sidebar-number-field sidebar-number-field-open' : 'sidebar-number-field'}
    >
      <div className="sidebar-number-field-inner">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="sidebar-number-field-input"
          value={draft}
          onChange={onInputChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onClick={() => setOpen(true)}
        />
      </div>
      {unit ? <span className="sidebar-number-field-unit">{unit}</span> : null}
      {typeof document !== 'undefined' && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

function formatPreset(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

// Round to at most 2 decimals and strip trailing zeros so drag-produced
// floats like 160.0234375 render as 160.02 (and integers stay clean).
function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

function snapToStep(v: number, min: number, max: number, step: number): number {
  const s = step > 0 ? step : 1;
  const snapped = Math.round((v - min) / s) * s + min;
  return clamp(snapped, min, max);
}

function derivePresets(
  min: number | undefined,
  max: number | undefined,
  step: number,
  current: number,
): number[] {
  const s = step > 0 ? step : 1;
  const set = new Set<number>();

  const add = (x: number) => {
    if (!Number.isFinite(x)) return;
    set.add(clamp(x, min, max));
  };

  if (min !== undefined) add(min);
  if (max !== undefined) add(max);

  if (min !== undefined && max !== undefined) {
    const span = max - min;
    const count = Math.floor(span / s) + 1;
    if (count <= MAX_PRESETS) {
      for (let i = 0; i < count; i++) {
        add(min + i * s);
      }
    } else {
      for (let i = 0; i < MAX_PRESETS; i++) {
        const t = i / (MAX_PRESETS - 1);
        add(snapToStep(min + t * span, min, max, s));
      }
    }
  }

  add(current);

  return [...set].sort((a, b) => a - b);
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}
