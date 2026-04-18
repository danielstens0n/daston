import type { CSSProperties } from 'react';
import type { CardInstance } from '../state/types.ts';
import { useInstanceInteraction } from './useInstanceInteraction.ts';
import './card.css';

type Props = {
  instance: CardInstance;
};

// The card renderer is just "apply props as CSS custom properties and render
// title/body." Drag/selection behavior is in useInstanceInteraction — every
// preview type will use the same hook.
export function Card({ instance }: Props) {
  const { isSelected, handlers } = useInstanceInteraction(instance);
  const p = instance.props;

  const style: CSSProperties & Record<string, string> = {
    transform: `translate(${instance.x}px, ${instance.y}px)`,
    '--card-fill': p.fill,
    '--card-border-color': p.borderColor,
    '--card-border-width': `${p.borderWidth}px`,
    '--card-border-radius': `${p.borderRadius}px`,
    '--card-width': `${p.width}px`,
    '--card-padding': `${p.padding}px`,
    '--card-shadow': `0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor}`,
    '--card-title-color': p.titleColor,
    '--card-body-color': p.bodyColor,
  };

  return (
    <div
      className="preview-card"
      data-selected={isSelected || undefined}
      data-shadow={p.shadowEnabled || undefined}
      style={style}
      {...handlers}
    >
      <h3 className="preview-card-title">Card</h3>
      <p className="preview-card-body">A simple card preview. Drag me around the canvas.</p>
    </div>
  );
}
