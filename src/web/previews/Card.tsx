import type { CSSProperties } from 'react';
import { previewTypographyVars } from '../lib/previewTypographyVars.ts';
import { useCardProps, useEditorStore } from '../state/editor.ts';
import { EditableText } from './EditableText.tsx';
import './card.css';

type Props = {
  id: string;
};

// CardProps → CSS variables; PreviewWrapper owns layout and selection chrome.
export function Card({ id }: Props) {
  const p = useCardProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--card-fill': p.fill,
    '--card-border-color': p.borderColor,
    '--card-border-width': `${p.borderWidth}px`,
    '--card-border-radius': `${p.borderRadius}px`,
    '--card-padding': `${p.padding}px`,
    '--card-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
    '--card-title-color': p.titleColor,
    '--card-body-color': p.bodyColor,
    ...previewTypographyVars(
      {
        font: '--card-title-font',
        size: '--card-title-size',
        weight: '--card-title-weight',
        style: '--card-title-style',
        decorationLine: '--card-title-decoration-line',
      },
      p.titleFont,
      p.titleFontSize,
      p.titleFontWeight,
      p.titleItalic,
      p.titleDecoration,
    ),
    ...previewTypographyVars(
      {
        font: '--card-body-font',
        size: '--card-body-size',
        weight: '--card-body-weight',
        style: '--card-body-style',
        decorationLine: '--card-body-decoration-line',
      },
      p.bodyFont,
      p.bodyFontSize,
      p.bodyFontWeight,
      p.bodyItalic,
      p.bodyDecoration,
    ),
  };

  return (
    <div className="preview-card" data-shadow={p.shadowEnabled || undefined} style={style}>
      <h3 className="preview-card-title">
        <EditableText
          instanceId={id}
          value={p.title}
          onChange={(title) => useEditorStore.getState().updateProps(id, { title })}
          multiline
        />
      </h3>
      <p className="preview-card-body">
        <EditableText
          instanceId={id}
          value={p.body}
          onChange={(body) => useEditorStore.getState().updateProps(id, { body })}
          multiline
        />
      </p>
    </div>
  );
}
