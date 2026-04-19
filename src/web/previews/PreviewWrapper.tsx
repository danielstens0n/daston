import type { ReactNode } from 'react';
import { useInstance } from '../state/editor.ts';
import { useInstanceInteraction } from './useInstanceInteraction.ts';
import { type ResizeCorner, useResizeInteraction } from './useResizeInteraction.ts';
import './preview-wrapper.css';

type Props = {
  id: string;
  children: ReactNode;
};

const CORNERS: readonly ResizeCorner[] = ['nw', 'ne', 'sw', 'se'];

// Position + size + drag + selection live here, not on the preview body.
// Because the wrapper carries no `border-radius`, its selection outline
// renders as a sharp rectangle even when the body inside has rounded corners.
// Shared by every preview type (Card today; Button, Table, Landing later).
export function PreviewWrapper({ id, children }: Props) {
  const instance = useInstance(id);
  const { isSelected, handlers } = useInstanceInteraction(id);
  if (!instance) return null;

  return (
    <div
      className="preview-wrapper"
      data-selected={isSelected || undefined}
      style={{
        transform: `translate(${instance.x}px, ${instance.y}px)`,
        width: `${instance.width}px`,
        height: `${instance.height}px`,
      }}
      {...handlers}
    >
      {children}
      {isSelected ? CORNERS.map((corner) => <ResizeHandle key={corner} id={id} corner={corner} />) : null}
    </div>
  );
}

function ResizeHandle({ id, corner }: { id: string; corner: ResizeCorner }) {
  const { handlers } = useResizeInteraction(id, corner);
  return <div className={`preview-resize-handle preview-resize-handle-${corner}`} {...handlers} />;
}
