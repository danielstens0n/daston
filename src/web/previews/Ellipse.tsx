import type { CSSProperties } from 'react';
import { previewBorderWidthCss, previewFillCss } from '../lib/previewSurfaceCss.ts';
import { useShapeProps } from '../state/editor.ts';
import './ellipse.css';

type Props = {
  id: string;
};

export function Ellipse({ id }: Props) {
  const p = useShapeProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--shape-fill': previewFillCss(p.fill, p.fillEnabled),
    '--shape-border-color': p.borderColor,
    '--shape-border-width': previewBorderWidthCss(p.borderWidth, p.borderEnabled),
    '--shape-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
  };

  return <div className="preview-ellipse" data-shadow={p.shadowEnabled || undefined} style={style} />;
}
