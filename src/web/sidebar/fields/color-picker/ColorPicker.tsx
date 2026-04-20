import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useThemeColors } from '../../../state/editor/selectors.ts';
import { useEditorStore } from '../../../state/editor/store.ts';
import { useColorPickerSession } from './ColorPickerContext.tsx';
import {
  clamp01,
  clamp255,
  HEX_6_OR_8_RE,
  type Hsva,
  hexToHsva,
  hsvaToHex,
  hsvaToRgba,
  mergeRgbHexWithAlpha,
  rgbaToHsva,
} from './color-math.ts';
import { releasePointerIfCaptured, useHorizontalSlider } from './use-horizontal-slider.ts';
import './color-picker.css';

const VAR_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

function getEyeDropperConstructor(): EyeDropperCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const E = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
  return typeof E === 'function' ? E : undefined;
}

export function ColorPicker() {
  const { value, onChange, onClose, anchorRect } = useColorPickerSession();
  const popoverRef = useRef<HTMLDivElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  const themeColors = useThemeColors();
  const upsertThemeColor = useEditorStore((s) => s.upsertThemeColor);

  const initialHsva = hexToHsva(value) ?? { h: 0, s: 0, v: 0, a: 1 };
  const [hsva, setHsva] = useState<Hsva>(initialHsva);
  const hsvaRef = useRef(hsva);
  hsvaRef.current = hsva;
  const [hexDraft, setHexDraft] = useState(() => hsvaToHex(initialHsva));
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  useLayoutEffect(() => {
    const parsed = hexToHsva(value);
    if (!parsed) return;
    const nextHex = hsvaToHex(parsed);
    if (nextHex === hsvaToHex(hsvaRef.current)) return;
    hsvaRef.current = parsed;
    setHsva(parsed);
    setHexDraft(nextHex);
  }, [value]);

  const rgba = hsvaToRgba(hsva);
  const currentHex = hsvaToHex(hsva);
  const opaqueRgb = `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;

  const pushHsva = useCallback(
    (next: Hsva) => {
      hsvaRef.current = next;
      setHsva(next);
      const hex = hsvaToHex(next);
      setHexDraft(hex);
      onChange(hex);
    },
    [onChange],
  );

  const positionStyle = useMemo(() => {
    const gap = 8;
    const width = Math.min(260, window.innerWidth - 16);
    const estimatedH = 420;

    let left = anchorRect.left - width - gap;
    if (left < gap) {
      left = anchorRect.right + gap;
    }
    left = Math.max(gap, Math.min(left, window.innerWidth - width - gap));

    let top = anchorRect.top;
    if (top + estimatedH > window.innerHeight - gap) {
      top = Math.max(gap, window.innerHeight - estimatedH - gap);
    }
    top = Math.max(gap, Math.min(top, window.innerHeight - estimatedH - gap));

    return {
      top,
      left,
      width,
      maxHeight: 'min(480px, calc(100vh - 16px))',
      overflowY: 'auto' as const,
    };
  }, [anchorRect]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (popoverRef.current?.contains(t)) return;
      const el = t instanceof Element ? t : null;
      if (el?.closest?.('[data-color-picker-anchor]')) return;
      onClose();
    }
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [onClose]);

  const readSv = useCallback((clientX: number, clientY: number) => {
    const el = svRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const s = clamp01((clientX - rect.left) / rect.width);
    const v = clamp01(1 - (clientY - rect.top) / rect.height);
    return { s, v };
  }, []);

  const onSvPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const next = readSv(e.clientX, e.clientY);
    if (!next) return;
    pushHsva({ ...hsvaRef.current, s: next.s, v: next.v });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onSvPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const next = readSv(e.clientX, e.clientY);
    if (!next) return;
    pushHsva({ ...hsvaRef.current, s: next.s, v: next.v });
  };

  const commitHueNorm = useCallback(
    (norm: number) => {
      pushHsva({ ...hsvaRef.current, h: norm * 360 });
    },
    [pushHsva],
  );

  const commitAlphaNorm = useCallback(
    (norm: number) => {
      pushHsva({ ...hsvaRef.current, a: norm });
    },
    [pushHsva],
  );

  const hueSlider = useHorizontalSlider(hueRef, commitHueNorm);
  const alphaSlider = useHorizontalSlider(alphaRef, commitAlphaNorm);

  const onHexChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexDraft(raw);
    if (HEX_6_OR_8_RE.test(raw)) {
      const parsed = hexToHsva(raw.toLowerCase());
      if (parsed) pushHsva(parsed);
    }
  };

  const onHexBlur = () => {
    if (HEX_6_OR_8_RE.test(hexDraft)) {
      const parsed = hexToHsva(hexDraft.toLowerCase());
      if (parsed) pushHsva(parsed);
    } else {
      setHexDraft(currentHex);
    }
  };

  const onRgbChange = (channel: 'r' | 'g' | 'b', raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const clamped = clamp255(n);
    const nextRgba = { ...rgba, [channel]: clamped };
    pushHsva(rgbaToHsva(nextRgba));
  };

  const eyeDropperCtor = getEyeDropperConstructor();

  const onEyedropper = () => {
    const E = eyeDropperCtor;
    if (!E) return;
    void new E().open().then((result) => {
      const merged = mergeRgbHexWithAlpha(result.sRGBHex, hsva.a);
      if (!merged) return;
      const parsed = hexToHsva(merged);
      if (parsed) pushHsva(parsed);
    });
  };

  const sortedVars = useMemo(
    () => Object.entries(themeColors).sort(([a], [b]) => a.localeCompare(b)),
    [themeColors],
  );

  const onPickVariable = (hex: string) => {
    const parsed = hexToHsva(hex);
    if (parsed) pushHsva(parsed);
  };

  const onSaveVariable = () => {
    const name = saveName.trim();
    if (!VAR_NAME_RE.test(name)) return;
    setSaveBusy(true);
    void upsertThemeColor(name, currentHex)
      .then(() => {
        setSaveOpen(false);
        setSaveName('');
      })
      .finally(() => {
        setSaveBusy(false);
      });
  };

  const portal = (
    <div className="color-picker-portal" ref={popoverRef} style={positionStyle}>
      <div
        className="color-picker-sv"
        ref={svRef}
        onPointerDown={onSvPointerDown}
        onPointerMove={onSvPointerMove}
        onPointerUp={releasePointerIfCaptured}
        onPointerCancel={releasePointerIfCaptured}
      >
        <div className="color-picker-sv-base" style={{ backgroundColor: `hsl(${hsva.h}, 100%, 50%)` }} />
        <div className="color-picker-sv-layer-white" />
        <div className="color-picker-sv-layer-black" />
        <div
          className="color-picker-sv-thumb"
          style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }}
        />
      </div>

      <div className="color-picker-controls-row">
        {eyeDropperCtor ? (
          <button
            className="color-picker-eyedropper"
            type="button"
            aria-label="Pick color from screen"
            title="Eyedropper"
            onClick={onEyedropper}
          >
            <svg
              className="color-picker-eyedropper-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Eyedropper</title>
              <path d="M3 21l5.5-5.5" />
              <path d="M18.84 3.16a2.1 2.1 0 0 0-2.97-2.97l-8.45 8.45-1.48 3.97 3.97-1.48 8.45-8.45z" />
            </svg>
          </button>
        ) : null}
        <div className="color-picker-preview" style={{ background: currentHex }} />
        <div
          className="color-picker-hue-track"
          ref={hueRef}
          onPointerDown={hueSlider.onPointerDown}
          onPointerMove={hueSlider.onPointerMove}
          onPointerUp={hueSlider.onPointerUp}
          onPointerCancel={hueSlider.onPointerCancel}
        >
          <div
            className="color-picker-slider-thumb"
            style={{
              left: `${(hsva.h / 360) * 100}%`,
              backgroundColor: `hsl(${hsva.h}, 100%, 50%)`,
            }}
          />
        </div>
      </div>

      <div className="color-picker-alpha-row">
        <div
          className="color-picker-alpha-track"
          ref={alphaRef}
          onPointerDown={alphaSlider.onPointerDown}
          onPointerMove={alphaSlider.onPointerMove}
          onPointerUp={alphaSlider.onPointerUp}
          onPointerCancel={alphaSlider.onPointerCancel}
        >
          <div
            className="color-picker-alpha-gradient"
            style={{
              background: `linear-gradient(to right, transparent, ${opaqueRgb})`,
            }}
          />
          <div
            className="color-picker-slider-thumb"
            style={{ left: `${hsva.a * 100}%`, backgroundColor: opaqueRgb }}
          />
        </div>
      </div>

      <div className="color-picker-inputs">
        <div>
          <input
            className="color-picker-hex-input"
            type="text"
            value={hexDraft}
            onChange={onHexChange}
            onBlur={onHexBlur}
            spellCheck={false}
          />
          <span className="color-picker-input-label">Hex</span>
        </div>
        {(['r', 'g', 'b'] as const).map((ch) => (
          <div key={ch}>
            <input
              className="color-picker-rgb-input"
              type="number"
              min={0}
              max={255}
              value={rgba[ch]}
              onChange={(e) => onRgbChange(ch, e.target.value)}
            />
            <span className="color-picker-input-label">{ch.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div className="color-picker-variables">
        <p className="color-picker-variables-title">Variables</p>
        <div className="color-picker-variables-row">
          {sortedVars.map(([name, hex]) => (
            <button
              key={name}
              type="button"
              className="color-picker-var-swatch"
              style={{ background: hex }}
              title={name}
              aria-label={`Apply color variable ${name}`}
              onClick={() => onPickVariable(hex)}
            />
          ))}
          <button
            type="button"
            className="color-picker-add-var"
            aria-label="Save current color as variable"
            title="Save as variable"
            onClick={() => setSaveOpen((o) => !o)}
          >
            +
          </button>
        </div>
        {saveOpen ? (
          <div className="color-picker-save-row">
            <input
              className="color-picker-save-name"
              type="text"
              placeholder="name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              spellCheck={false}
            />
            <button
              className="color-picker-save-btn"
              type="button"
              disabled={saveBusy || !VAR_NAME_RE.test(saveName.trim())}
              onClick={onSaveVariable}
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}
