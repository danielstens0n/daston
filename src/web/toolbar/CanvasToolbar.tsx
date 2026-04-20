import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentId } from '../../shared/types.ts';
import { useCanvasHandle } from '../canvas/Canvas.tsx';
import { screenToWorld } from '../canvas/viewport-math.ts';
import { useEditorStore } from '../state/editor.ts';
import { SHAPE_TOOLBAR_ENTRIES } from './catalog.ts';
import { ImportComponentDialog } from './ImportComponentDialog.tsx';
import { InsertMenuPopover } from './InsertMenuPopover.tsx';
import { PlusIcon } from './icons.tsx';
import './canvas-toolbar.css';

// Floating pill anchored to the bottom-center of the canvas viewport. Shape
// tools activate draw mode on the canvas; plus opens an insert menu for shapes,
// components, and import.
export function CanvasToolbar() {
  const handle = useCanvasHandle();
  const plusRef = useRef<HTMLButtonElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);

  const { activeTool, setActiveTool } = useEditorStore(
    useShallow((s) => ({ activeTool: s.activeTool, setActiveTool: s.setActiveTool })),
  );

  function getWorldCenter() {
    const el = handle.getViewportEl();
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return screenToWorld({ x: rect.width / 2, y: rect.height / 2 }, handle.getView());
  }

  function onAddComponent(type: ComponentId) {
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
      <div className="canvas-toolbar" role="toolbar" aria-label="Canvas tools">
        {SHAPE_TOOLBAR_ENTRIES.map(({ tool, label, Icon }) => (
          <button
            key={tool}
            type="button"
            className="canvas-toolbar-button"
            data-tooltip={label}
            data-active={activeTool === tool || undefined}
            aria-label={label}
            aria-pressed={activeTool === tool}
            onClick={() => {
              setInsertOpen(false);
              setActiveTool(activeTool === tool ? 'select' : tool);
            }}
          >
            <Icon />
          </button>
        ))}
        <div className="canvas-toolbar-divider" aria-hidden />
        <div className="canvas-toolbar-anchor">
          <button
            ref={plusRef}
            type="button"
            className="canvas-toolbar-button"
            data-tooltip="Insert"
            data-active={insertOpen || undefined}
            aria-label="Insert"
            aria-expanded={insertOpen}
            aria-haspopup="dialog"
            onClick={() => setInsertOpen((open) => !open)}
          >
            <PlusIcon />
          </button>
          <InsertMenuPopover
            open={insertOpen}
            anchorRef={plusRef}
            onClose={() => setInsertOpen(false)}
            onPickShape={(tool) => {
              setActiveTool(tool);
              setInsertOpen(false);
            }}
            onPickComponent={(id) => {
              onAddComponent(id);
              setInsertOpen(false);
            }}
            onPickImport={() => {
              setImportOpen(true);
              setInsertOpen(false);
            }}
          />
        </div>
      </div>
      <ImportComponentDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={onImport} />
    </>
  );
}
