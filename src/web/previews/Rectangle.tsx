import type { CSSProperties } from 'react';
import { useShapeProps } from '../state/editor.ts';
import './rectangle.css';

type Props = {
  id: string;
};

export function Rectangle({ id }: Props) {
  const p = useShapeProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--shape-fill': p.fill,
    '--shape-border-color': p.borderColor,
    '--shape-border-width': `${p.borderWidth}px`,
    '--shape-border-radius': `${p.borderRadius}px`,
    '--shape-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
  };

  return <div className="preview-rectangle" data-shadow={p.shadowEnabled || undefined} style={style} />;
}
