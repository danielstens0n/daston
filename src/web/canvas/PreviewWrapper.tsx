import type { MouseEvent, ReactNode } from 'react';
import { useContextMenuHost } from '../context-menu/ContextMenu.tsx';
import { buildInstanceMenuItems } from '../context-menu/items.ts';
import { useEditorStore, useInstance } from '../state/editor.ts';
import { InstanceIdProvider, useInstanceId } from './InstanceIdContext.tsx';
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
  const { openMenu } = useContextMenuHost();
  if (!instance) return null;

  function onContextMenu(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    useEditorStore.getState().select(id);
    openMenu({
      clientX: event.clientX,
      clientY: event.clientY,
      items: buildInstanceMenuItems(id),
    });
  }

  return (
    <InstanceIdProvider id={id}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper handles drag + instance context menu */}
      <div
        className="preview-wrapper"
        data-selected={isSelected || undefined}
        style={{
          transform: `translate(${instance.x}px, ${instance.y}px)`,
          width: `${instance.width}px`,
          height: `${instance.height}px`,
        }}
        {...handlers}
        onContextMenu={onContextMenu}
      >
        {children}
        {isSelected ? CORNERS.map((corner) => <ResizeHandle key={corner} corner={corner} />) : null}
      </div>
    </InstanceIdProvider>
  );
}

function ResizeHandle({ corner }: { corner: ResizeCorner }) {
  const id = useInstanceId();
  const { handlers } = useResizeInteraction(id, corner);
  return <div className={`preview-resize-handle preview-resize-handle-${corner}`} {...handlers} />;
}
