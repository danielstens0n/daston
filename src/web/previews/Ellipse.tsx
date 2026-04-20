import type { CSSProperties } from 'react';
import { useShapeProps } from '../state/editor.ts';
import './ellipse.css';

type Props = {
  id: string;
};

export function Ellipse({ id }: Props) {
  const p = useShapeProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--shape-fill': p.fill,
    '--shape-border-color': p.borderColor,
    '--shape-border-width': `${p.borderWidth}px`,
    '--shape-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
  };

  return <div className="preview-ellipse" data-shadow={p.shadowEnabled || undefined} style={style} />;
}
