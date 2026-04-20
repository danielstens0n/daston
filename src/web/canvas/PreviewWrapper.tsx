import type { MouseEvent, ReactNode } from 'react';
import { useContextMenuHost } from '../context-menu/ContextMenu.tsx';
import { buildInstanceMenuItems } from '../context-menu/items.ts';
import {
  useEditorStore,
  useInstance,
  useIsDropTarget,
  useIsHovered,
  useIsSelectionRoot,
  useResizeLockedAxes,
} from '../state/editor.ts';
import { renderPreviewBody } from '../state/registry/component-registry.tsx';
import { useIsTextEditActiveForInstance } from '../state/text-edit.ts';
import { InstanceIdProvider, useInstanceId } from './InstanceIdContext.tsx';
import { useInstanceInteraction } from './useInstanceInteraction.ts';
import { type ResizeAxisLocks, type ResizeCorner, useResizeInteraction } from './useResizeInteraction.ts';
import './preview-wrapper.css';

type Props = {
  id: string;
  /** Tests and special cases can inject markup; otherwise the body comes from `renderPreviewBody`. */
  children?: ReactNode;
};

const CORNERS: readonly ResizeCorner[] = ['nw', 'ne', 'sw', 'se'];

// Position + size + drag + selection live here, not on the preview body.
// Because the wrapper carries no `border-radius`, its selection outline
// renders as a sharp rectangle even when the body inside has rounded corners.
// Shared by every preview type (Card today; Button, Table, Landing later).
export function PreviewWrapper({ id, children }: Props) {
  const instance = useInstance(id);
  const resizeLocks = useResizeLockedAxes(id);
  const { isSelected, handlers } = useInstanceInteraction(id);
  const isDropTarget = useIsDropTarget(id);
  const isHovered = useIsHovered(id);
  const isSelectionRoot = useIsSelectionRoot(id);
  const isEditing = useIsTextEditActiveForInstance(id);
  const { openMenu } = useContextMenuHost();
  if (!instance) return null;
  const body = children ?? renderPreviewBody(instance);

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

  function onPointerEnter() {
    const store = useEditorStore.getState();
    if (store.activeTool === 'select') store.setHoveredId(id);
  }

  function onPointerLeave() {
    // Guard against a nested wrapper's leave clearing an outer wrapper's
    // hover when the pointer stays inside the outer — only drop hover if
    // this instance is still the hovered one.
    const store = useEditorStore.getState();
    if (store.hoveredId === id) store.setHoveredId(null);
  }

  return (
    <InstanceIdProvider id={id}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper handles drag + instance context menu */}
      <div
        className="preview-wrapper"
        data-selected={isSelected || undefined}
        data-hovered={isHovered || undefined}
        data-editing={isEditing || undefined}
        data-selection-root={isSelectionRoot || undefined}
        data-drop-target={isDropTarget || undefined}
        style={{
          transform: `translate(${instance.x}px, ${instance.y}px)`,
          width: `${instance.width}px`,
          height: `${instance.height}px`,
        }}
        {...handlers}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onContextMenu={onContextMenu}
      >
        {body}
        {isSelected && !isEditing
          ? CORNERS.map((corner) => <ResizeHandle key={corner} corner={corner} locks={resizeLocks} />)
          : null}
      </div>
    </InstanceIdProvider>
  );
}

function ResizeHandle({ corner, locks }: { corner: ResizeCorner; locks: ResizeAxisLocks }) {
  const id = useInstanceId();
  const { handlers } = useResizeInteraction(id, corner, locks);
  return <div className={`preview-resize-handle preview-resize-handle-${corner}`} {...handlers} />;
}
