import type { CSSProperties } from 'react';
import { previewTypographyVars } from '../lib/previewTypographyVars.ts';
import { useButtonProps, useUpdateProps } from '../state/editor.ts';
import { EditableText } from './EditableText.tsx';
import './button.css';

type Props = {
  id: string;
};

export function Button({ id }: Props) {
  const p = useButtonProps(id);
  const updateProps = useUpdateProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--button-fill': p.fill,
    '--button-border-color': p.borderColor,
    '--button-border-width': `${p.borderWidth}px`,
    '--button-border-radius': `${p.borderRadius}px`,
    '--button-padding-x': `${p.paddingX}px`,
    '--button-padding-y': `${p.paddingY}px`,
    '--button-text-color': p.textColor,
    '--button-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
    ...previewTypographyVars(
      {
        font: '--button-label-font',
        size: '--button-label-size',
        weight: '--button-label-weight',
        style: '--button-label-style',
        decorationLine: '--button-label-decoration-line',
      },
      p.labelFont,
      p.labelFontSize,
      p.labelFontWeight,
      p.labelItalic,
      p.labelDecoration,
    ),
  };

  return (
    <div className="preview-button" data-shadow={p.shadowEnabled || undefined} style={style}>
      <EditableText
        value={p.label}
        onChange={(label) => updateProps({ label })}
        className="preview-button-label"
      />
    </div>
  );
}
