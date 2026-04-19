import { useState } from 'react';
import type { ComponentId } from '../../shared/types.ts';
import { useCanvasHandle } from '../canvas/Canvas.tsx';
import { screenToWorld } from '../canvas/viewport-math.ts';
import { useEditorStore } from '../state/editor.ts';
import { TOOLBAR_ITEMS, type ToolbarItem } from './catalog.ts';
import { ImportComponentDialog } from './ImportComponentDialog.tsx';
import './canvas-toolbar.css';

// Floating pill anchored to the bottom-center of the canvas viewport. Sits
// in the Canvas overlay slot, so it stays put during pan/zoom. Each button
// adds a new instance at the world-space center of the currently visible
// viewport. Disabled items show a "coming soon" tooltip.
export function CanvasToolbar() {
  const handle = useCanvasHandle();
  const [isImportOpen, setIsImportOpen] = useState(false);

  function getWorldCenter() {
    const el = handle.getViewportEl();
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, handle.getView());
  }

  function onAdd(type: ComponentId) {
    const worldCenter = getWorldCenter();
    if (!worldCenter) return;
    useEditorStore.getState().addInstance(type, worldCenter);
  }

  function onImport(definitionId: string) {
    const worldCenter = getWorldCenter();
    if (!worldCenter) return;
    useEditorStore.getState().addImportedInstance(definitionId, worldCenter);
  }

  return (
    <>
      <div className="canvas-toolbar" role="toolbar" aria-label="Add component">
        {TOOLBAR_ITEMS.map((item) => (
          <ToolbarButton key={item.id} item={item} onAdd={onAdd} onOpenImport={() => setIsImportOpen(true)} />
        ))}
      </div>
      <ImportComponentDialog open={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={onImport} />
    </>
  );
}

function ToolbarButton({
  item,
  onAdd,
  onOpenImport,
}: {
  item: ToolbarItem;
  onAdd: (type: ComponentId) => void;
  onOpenImport: () => void;
}) {
  const { Icon, label, enabled, tooltip, active } = item;
  return (
    <button
      type="button"
      className="canvas-toolbar-button"
      data-tooltip={tooltip}
      data-active={active || undefined}
      aria-label={enabled ? label : `${label} (coming soon)`}
      disabled={!enabled}
      onClick={() => {
        if (item.kind === 'action') {
          onOpenImport();
          return;
        }
        onAdd(item.id);
      }}
    >
      <Icon />
    </button>
  );
}
