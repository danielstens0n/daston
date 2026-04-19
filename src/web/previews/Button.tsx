import type { CSSProperties } from 'react';
import { useButtonProps } from '../state/editor.ts';
import './button.css';

type Props = {
  id: string;
};

export function Button({ id }: Props) {
  const p = useButtonProps(id);
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
  };

  return (
    <div className="preview-button" data-shadow={p.shadowEnabled || undefined} style={style}>
      <span className="preview-button-label">{p.label}</span>
    </div>
  );
}
