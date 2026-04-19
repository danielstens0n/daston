import type { ComponentId } from '../../shared/types.ts';
import { useCanvasHandle } from '../canvas/Canvas.tsx';
import { screenToWorld } from '../canvas/viewport-math.ts';
import { useEditorStore } from '../state/editor.ts';
import { TOOLBAR_ITEMS, type ToolbarItem } from './catalog.ts';
import './canvas-toolbar.css';

// Floating pill anchored to the bottom-center of the canvas viewport. Sits
// in the Canvas overlay slot, so it stays put during pan/zoom. Each button
// adds a new instance at the world-space center of the currently visible
// viewport. Disabled items show a "coming soon" tooltip.
export function CanvasToolbar() {
  const handle = useCanvasHandle();

  function onAdd(type: ComponentId) {
    const el = handle.getViewportEl();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const worldCenter = screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, handle.getView());
    useEditorStore.getState().addInstance(type, worldCenter);
  }

  return (
    <div className="canvas-toolbar" role="toolbar" aria-label="Add component">
      {TOOLBAR_ITEMS.map((item) => (
        <ToolbarButton key={item.id} item={item} onAdd={onAdd} />
      ))}
    </div>
  );
}

function ToolbarButton({ item, onAdd }: { item: ToolbarItem; onAdd: (type: ComponentId) => void }) {
  const { Icon, label, enabled, id, tooltip, active } = item;
  return (
    <button
      type="button"
      className="canvas-toolbar-button"
      data-tooltip={tooltip}
      data-active={active || undefined}
      aria-label={enabled ? `Add ${label}` : `${label} (coming soon)`}
      disabled={!enabled}
      onClick={() => onAdd(id)}
    >
      <Icon />
    </button>
  );
}
