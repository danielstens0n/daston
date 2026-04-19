import { type CSSProperties, type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCanvasHandle } from '../canvas/Canvas.tsx';
import { useEditorStore } from '../state/editor.ts';
import { elementRectToWorldRect, useTextEditStore, type WorldRect } from '../state/text-edit.ts';
import './editable-text.css';
import './text-edit-layer.css';

type TypographyStyle = Pick<
  CSSProperties,
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'fontStyle'
  | 'fontVariant'
  | 'letterSpacing'
  | 'wordSpacing'
  | 'lineHeight'
  | 'color'
  | 'textAlign'
  | 'textTransform'
  | 'fontFeatureSettings'
>;

function readTypography(el: HTMLElement): TypographyStyle {
  const cs = window.getComputedStyle(el);
  return {
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    fontStyle: cs.fontStyle,
    fontVariant: cs.fontVariant,
    letterSpacing: cs.letterSpacing,
    wordSpacing: cs.wordSpacing,
    lineHeight: cs.lineHeight,
    color: cs.color,
    textAlign: cs.textAlign as CSSProperties['textAlign'],
    textTransform: cs.textTransform as CSSProperties['textTransform'],
    fontFeatureSettings: cs.fontFeatureSettings,
  };
}

export function TextEditLayer() {
  const active = useTextEditStore((s) => s.active);
  const setDraft = useTextEditStore((s) => s.setDraft);
  const commit = useTextEditStore((s) => s.commit);
  const cancel = useTextEditStore((s) => s.cancel);
  const handle = useCanvasHandle();
  // Narrow selector: a boolean derived from the session's id so dragging other
  // previews (which replaces `instances`) does not re-render this layer.
  const sessionId = active?.instanceId;
  const sessionInstanceExists = useEditorStore((s) =>
    sessionId === undefined ? true : s.instances.some((i) => i.id === sessionId),
  );
  const [worldRect, setWorldRect] = useState<WorldRect | null>(null);
  // Snapshot of the anchor's computed typography so the overlay control
  // matches the underlying text. Needed because the overlay is rendered at
  // the canvas root, not inside the original DOM ancestor, so `font: inherit`
  // picks up the browser default instead of e.g. `.preview-card-body`.
  const [typography, setTypography] = useState<TypographyStyle | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const ignoreBlurRef = useRef(false);

  const sessionLayoutKey =
    active === null ? null : `${active.anchorKey}\0${active.baseline}\0${active.instanceId}`;

  useEffect(() => {
    if (sessionId !== undefined && !sessionInstanceExists) {
      useTextEditStore.getState().cancel();
    }
  }, [sessionId, sessionInstanceExists]);

  useLayoutEffect(() => {
    if (!sessionLayoutKey) {
      setWorldRect(null);
      setTypography(null);
      return;
    }
    let typographyCaptured = false;
    function measure() {
      const session = useTextEditStore.getState().active;
      if (!session) return;
      const getter = useTextEditStore.getState().getAnchor(session.anchorKey);
      const el = getter?.() ?? null;
      const viewport =
        handle.getViewportEl() ??
        (el instanceof HTMLElement ? (el.closest('.canvas-viewport') as HTMLDivElement | null) : null);
      if (!el || !viewport) return;
      if (!typographyCaptured) {
        setTypography(readTypography(el));
        typographyCaptured = true;
      }
      const next = elementRectToWorldRect(el, viewport, handle.getView());
      // Skip setState when the rect is unchanged — avoids re-rendering the
      // layer (and remounting the input) every frame while the rAF loop runs.
      setWorldRect((prev) =>
        prev &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      );
    }
    measure();
    let raf = 0;
    let stopped = false;
    function loop() {
      if (stopped) return;
      measure();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [sessionLayoutKey, handle]);

  useLayoutEffect(() => {
    if (!sessionLayoutKey) return;
    let cancelled = false;
    let raf = 0;
    function tryFocus() {
      if (cancelled) return;
      const el = inputRef.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
        return;
      }
      raf = requestAnimationFrame(tryFocus);
    }
    tryFocus();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [sessionLayoutKey]);

  useLayoutEffect(() => {
    if (!active?.multiline) return;
    const el = inputRef.current;
    if (!(el instanceof HTMLTextAreaElement)) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [active]);

  if (!active || !worldRect) return null;

  const session = active;

  function onBlur() {
    if (ignoreBlurRef.current) {
      ignoreBlurRef.current = false;
      return;
    }
    commit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!session.multiline && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      ignoreBlurRef.current = true;
      cancel();
    }
  }

  const controlClassName = 'preview-inline-text-input text-edit-layer-control';
  const baseControlStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    ...typography,
  };

  return (
    <div className="text-edit-layer-root">
      <div
        className="text-edit-layer-surface"
        style={{
          left: worldRect.x,
          top: worldRect.y,
          width: worldRect.width,
        }}
      >
        {session.multiline ? (
          <textarea
            ref={(node) => {
              inputRef.current = node;
            }}
            data-preview-interactive="true"
            className={controlClassName}
            value={session.draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            rows={1}
            style={{ ...baseControlStyle, minHeight: worldRect.height }}
          />
        ) : (
          <input
            ref={(node) => {
              inputRef.current = node;
            }}
            data-preview-interactive="true"
            className={controlClassName}
            type="text"
            value={session.draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            style={{ ...baseControlStyle, height: worldRect.height }}
          />
        )}
      </div>
    </div>
  );
}
