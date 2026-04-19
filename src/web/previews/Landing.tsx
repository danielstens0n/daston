import type { CSSProperties } from 'react';
import { useLandingProps } from '../state/editor.ts';
import './landing.css';

type Props = {
  id: string;
};

export function Landing({ id }: Props) {
  const p = useLandingProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--landing-page-fill': p.pageFill,
    '--landing-hero-fill': p.heroFill,
    '--landing-features-fill': p.featuresFill,
    '--landing-accent': p.accentColor,
    '--landing-border-radius': `${p.borderRadius}px`,
    '--landing-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
  };

  return (
    <div className="preview-landing" style={style}>
      <div className="preview-landing-hero" data-shadow={p.shadowEnabled || undefined}>
        <h2 className="preview-landing-title">{p.heroTitle}</h2>
        <p className="preview-landing-body">{p.heroBody}</p>
        <span className="preview-landing-cta">{p.ctaLabel}</span>
      </div>
      <div className="preview-landing-features">
        <p className="preview-landing-features-title">Features</p>
        <ul className="preview-landing-feature-list">
          <li className="preview-landing-feature">Theme tokens synced with your stack</li>
          <li className="preview-landing-feature">Preview components on the canvas</li>
          <li className="preview-landing-feature">Export-ready handoff</li>
        </ul>
      </div>
    </div>
  );
}
