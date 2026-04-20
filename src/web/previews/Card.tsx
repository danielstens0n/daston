import type { CSSProperties } from 'react';
import { useCardProps } from '../state/editor.ts';
import './card.css';

type Props = {
  id: string;
};

/** Card surface (fill, border, shadow, padding). Title/body are separate `text` child instances. */
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
  };

  return <div className="preview-card" data-shadow={p.shadowEnabled || undefined} style={style} />;
}
