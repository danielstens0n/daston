import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { ComponentId } from '../../shared/types.ts';
import { INSERT_COMPONENT_ENTRIES, SHAPE_TOOLBAR_ENTRIES, type ShapeToolId } from './catalog.ts';

type Props = {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onPickShape: (tool: ShapeToolId) => void;
  onPickComponent: (id: ComponentId) => void;
  onPickImport: () => void;
};

export function InsertMenuPopover({
  open,
  anchorRef,
  onClose,
  onPickShape,
  onPickComponent,
  onPickImport,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(event: PointerEvent) {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panel?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="insert-menu-popover"
      role="dialog"
      aria-modal="true"
      aria-label="Insert"
      data-canvas-shortcuts-block
    >
      <p className="insert-menu-heading">Shapes</p>
      <div className="insert-menu-grid">
        {SHAPE_TOOLBAR_ENTRIES.map(({ tool, label, Icon }) => (
          <button
            key={tool}
            type="button"
            className="insert-menu-tile"
            aria-label={label}
            onClick={() => {
              onPickShape(tool);
            }}
          >
            <span className="insert-menu-tile-graphic" aria-hidden>
              <Icon />
            </span>
            <span className="insert-menu-tile-label">{label}</span>
          </button>
        ))}
      </div>
      <p className="insert-menu-heading">Components</p>
      <div className="insert-menu-grid">
        {INSERT_COMPONENT_ENTRIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="insert-menu-tile"
            aria-label={label}
            onClick={() => {
              onPickComponent(id);
            }}
          >
            <span className="insert-menu-tile-graphic" aria-hidden>
              <Icon />
            </span>
            <span className="insert-menu-tile-label">{label}</span>
          </button>
        ))}
      </div>
      <div className="insert-menu-footer">
        <button type="button" className="insert-menu-import-link" onClick={onPickImport}>
          Import custom…
        </button>
      </div>
    </div>
  );
}
