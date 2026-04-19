import type { ReactNode } from 'react';
import { useInstance } from '../state/editor.ts';
import { useInstanceInteraction } from './useInstanceInteraction.ts';
import './preview-wrapper.css';

type Props = {
  id: string;
  children: ReactNode;
};

// Position + drag + selection live here, not on the preview body. Because
// the wrapper carries no `border-radius`, its selection outline renders as
// a sharp rectangle even when the body inside has rounded corners.
// Shared by every preview type (Card today; Button, Table, Landing later).
export function PreviewWrapper({ id, children }: Props) {
  const instance = useInstance(id);
  const { isSelected, handlers } = useInstanceInteraction(id);
  if (!instance) return null;

  return (
    <div
      className="preview-wrapper"
      data-selected={isSelected || undefined}
      style={{ transform: `translate(${instance.x}px, ${instance.y}px)` }}
      {...handlers}
    >
      {children}
    </div>
  );
}
