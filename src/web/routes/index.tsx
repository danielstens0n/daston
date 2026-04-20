import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Canvas } from '../canvas/Canvas.tsx';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { useKeyboardShortcuts } from '../keyboard/useKeyboardShortcuts.ts';
import { LayersSidebar } from '../layers/LayersSidebar.tsx';
import { PreviewWrapper } from '../previews/PreviewWrapper.tsx';
import { TextEditLayer } from '../previews/TextEditLayer.tsx';
import { Sidebar } from '../sidebar/Sidebar.tsx';
import { renderPreviewBody } from '../state/component-registry.tsx';
import { useInstance, useInstanceIds } from '../state/editor.ts';
import { useImportedComponentsStore } from '../state/imported-components.ts';
import { CanvasToolbar } from '../toolbar/CanvasToolbar.tsx';
import './route.css';

export const Route = createFileRoute('/')({
  component: CanvasRoute,
});

function CanvasRoute() {
  useKeyboardShortcuts();
  useEffect(() => {
    void useImportedComponentsStore.getState().load();
  }, []);
  // Subscribing only to the id list keeps the route stable across drags and
  // prop edits — each PreviewSlot pulls its own instance data.
  const instanceIds = useInstanceIds();
  return (
    <ContextMenuProvider>
      <div className="route-shell">
        <LayersSidebar />
        <div className="route-canvas">
          <Canvas overlay={<CanvasToolbar />}>
            {instanceIds.map((id) => (
              <PreviewSlot key={id} id={id} />
            ))}
            <TextEditLayer />
          </Canvas>
        </div>
        <Sidebar />
      </div>
    </ContextMenuProvider>
  );
}

// PreviewWrapper owns position and selection outline; the body is dispatched
// on instance.type so each preview subscribes to its own props by id.
function PreviewSlot({ id }: { id: string }) {
  const instance = useInstance(id);
  if (!instance) return null;
  return <PreviewWrapper id={id}>{renderPreviewBody(instance)}</PreviewWrapper>;
}
