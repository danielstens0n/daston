import type { CSSProperties } from 'react';
import { useEditorStore, useLandingProps } from '../state/editor.ts';
import { EditableText } from './EditableText.tsx';
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
        <h2 className="preview-landing-title">
          <EditableText
            value={p.heroTitle}
            onChange={(heroTitle) => useEditorStore.getState().updateProps(id, { heroTitle })}
            multiline
          />
        </h2>
        <p className="preview-landing-body">
          <EditableText
            value={p.heroBody}
            onChange={(heroBody) => useEditorStore.getState().updateProps(id, { heroBody })}
            multiline
          />
        </p>
        <span className="preview-landing-cta">
          <EditableText
            value={p.ctaLabel}
            onChange={(ctaLabel) => useEditorStore.getState().updateProps(id, { ctaLabel })}
          />
        </span>
      </div>
      <div className="preview-landing-features">
        <p className="preview-landing-features-title">
          <EditableText
            value={p.featuresTitle}
            onChange={(featuresTitle) => useEditorStore.getState().updateProps(id, { featuresTitle })}
            multiline
          />
        </p>
        <ul className="preview-landing-feature-list">
          {p.features.map((feature, index) => (
            <li key={`${id}-feature-${feature}`} className="preview-landing-feature">
              <EditableText
                value={feature}
                onChange={(nextFeature) =>
                  useEditorStore.getState().updateProps(id, {
                    features: p.features.map((entry, featureIndex) =>
                      featureIndex === index ? nextFeature : entry,
                    ),
                  })
                }
                multiline
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
