import type { CSSProperties } from 'react';
import { previewTypographyVars } from '../lib/previewTypographyVars.ts';
import { useEditorStore, useTextPrimitiveProps, useUpdateProps } from '../state/editor.ts';
import { EditableText } from './EditableText.tsx';
import './text.css';

type Props = {
  id: string;
};

export function Text({ id }: Props) {
  const p = useTextPrimitiveProps(id);
  const updateProps = useUpdateProps(id);
  const openOnMount = useEditorStore((s) => s.pendingTextEditInstanceId === id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--text-color': p.textColor,
    '--text-align': p.textAlign,
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

  return (
    <div className="preview-text-root" style={style}>
      <EditableText
        value={p.text}
        onChange={(text) => updateProps({ text })}
        multiline
        layerId="text"
        className="preview-text-content"
        openOnMount={openOnMount}
      />
    </div>
  );
}
