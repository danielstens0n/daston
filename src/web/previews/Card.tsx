import type { CSSProperties } from 'react';
import { useCardProps, useEditorStore } from '../state/editor.ts';
import { EditableText } from './EditableText.tsx';
import './card.css';

type Props = {
  id: string;
};

// Body-only: the PreviewWrapper owns position, drag handlers, and the
// selection outline. Card just subscribes to its own CardProps by id and
// projects them onto the element via CSS custom properties.
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
  };

  return (
    <div className="preview-card" data-shadow={p.shadowEnabled || undefined} style={style}>
      <h3 className="preview-card-title">
        <EditableText
          value={p.title}
          onChange={(title) => useEditorStore.getState().updateProps(id, { title })}
          multiline
        />
      </h3>
      <p className="preview-card-body">
        <EditableText
          value={p.body}
          onChange={(body) => useEditorStore.getState().updateProps(id, { body })}
          multiline
        />
      </p>
    </div>
  );
}
