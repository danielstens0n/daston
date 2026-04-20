import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { previewTypographyVars } from '../lib/previewTypographyVars.ts';
import {
  useEditorStore,
  useInstance,
  useTextAutoResize,
  useTextPrimitiveProps,
  useUpdateProps,
} from '../state/editor.ts';
import type { TextCase, TextVerticalAlign } from '../state/types.ts';
import { EditableText } from './EditableText.tsx';
import './text.css';

type Props = {
  id: string;
};

function valignToJustify(v: TextVerticalAlign): string {
  switch (v) {
    case 'top':
      return 'flex-start';
    case 'middle':
      return 'center';
    case 'bottom':
      return 'flex-end';
  }
}

function textCaseToTransform(tc: TextCase): string {
  switch (tc) {
    case 'none':
      return 'none';
    case 'upper':
      return 'uppercase';
    case 'lower':
      return 'lowercase';
    case 'title':
      return 'capitalize';
  }
}

const PARAGRAPH_SPLIT = /\n\n+/;

function paragraphDisplayChildren(text: string, paragraphSpacing: number): ReactNode | undefined {
  if (paragraphSpacing <= 0 || !PARAGRAPH_SPLIT.test(text)) return undefined;
  const parts = text.split(PARAGRAPH_SPLIT);
  return parts.map((part, i) => {
    const key = `${i}:${part.length}:${part.charCodeAt(0)}`;
    return (
      <span
        key={key}
        className="preview-text-paragraph"
        style={{ marginBottom: i < parts.length - 1 ? paragraphSpacing : 0 }}
      >
        {part}
      </span>
    );
  });
}

export function Text({ id }: Props) {
  const p = useTextPrimitiveProps(id);
  const inst = useInstance(id);
  const updateProps = useUpdateProps(id);
  const openOnMount = useEditorStore((s) => s.pendingTextEditInstanceId === id);
  const measureRef = useRef<HTMLButtonElement>(null);
  useTextAutoResize(id, measureRef);

  const displayChildren = useMemo(() => {
    if (!p) return undefined;
    return paragraphDisplayChildren(p.text, p.textParagraphSpacing);
  }, [p]);

  if (!p || !inst) return null;

  const effectiveLineHeight = p.textLineHeight > 0 ? p.textLineHeight : 1.2;
  const innerH = Math.max(1, inst.height - 8);
  const lineHeightPx = p.textFontSize * effectiveLineHeight;
  const lineClamp =
    p.textOverflow === 'ellipsis' ? Math.max(1, Math.floor(innerH / lineHeightPx)) : undefined;

  const style: CSSProperties & Record<string, string> = {
    '--text-color': p.textColor,
    '--text-align': p.textAlign,
    '--text-valign': valignToJustify(p.textVerticalAlign),
    '--text-line-height': p.textLineHeight > 0 ? String(p.textLineHeight) : 'normal',
    '--text-letter-spacing': `${p.textLetterSpacing}px`,
    '--text-transform': textCaseToTransform(p.textCase),
    ...previewTypographyVars(
      {
        font: '--text-font',
        size: '--text-size',
        weight: '--text-weight',
        style: '--text-style',
        decorationLine: '--text-decoration-line',
      },
      p.textFont,
      p.textFontSize,
      p.textFontWeight,
      p.textItalic,
      p.textDecoration,
    ),
  };
  if (lineClamp !== undefined) {
    style['--text-line-clamp'] = String(lineClamp);
  }

  return (
    <div
      className="preview-text-root"
      style={style}
      data-text-overflow={p.textOverflow === 'ellipsis' ? 'ellipsis' : undefined}
    >
      <EditableText
        ref={measureRef}
        value={p.text}
        onChange={(text) => updateProps({ text })}
        multiline
        layerId="text"
        className="preview-text-content"
        openOnMount={openOnMount}
      >
        {displayChildren}
      </EditableText>
    </div>
  );
}
