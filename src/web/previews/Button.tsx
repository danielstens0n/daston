import type { CSSProperties } from 'react';
import { previewBorderWidthCss, previewFillCss } from '../lib/previewSurfaceCss.ts';
import { useButtonProps } from '../state/editor.ts';
import './button.css';

type Props = {
  id: string;
};

/** Button chrome; label is a separate `text` child instance. */
export function Button({ id }: Props) {
  const p = useButtonProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--button-fill': previewFillCss(p.fill, p.fillEnabled),
    '--button-border-color': p.borderColor,
    '--button-border-width': previewBorderWidthCss(p.borderWidth, p.borderEnabled),
    '--button-border-radius': `${p.borderRadius}px`,
    '--button-padding-x': `${p.paddingX}px`,
    '--button-padding-y': `${p.paddingY}px`,
    '--button-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
  };

  return <div className="preview-button" data-shadow={p.shadowEnabled || undefined} style={style} />;
}
