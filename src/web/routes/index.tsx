import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useLayoutEffect } from 'react';
import { Canvas } from '../canvas/Canvas.tsx';
import { PreviewWrapper } from '../canvas/PreviewWrapper.tsx';
import { TextEditLayer } from '../canvas/TextEditLayer.tsx';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { LayersSidebar } from '../layers/LayersSidebar.tsx';
import { fetchTheme } from '../lib/api.ts';
import { useKeyboardShortcuts } from '../lib/useKeyboardShortcuts.ts';
import { Sidebar } from '../sidebar/Sidebar.tsx';
import { useEditorStore, useOrderedInstanceIds } from '../state/editor.ts';
import { useImportedComponentsStore } from '../state/registry/imported.ts';
import { CanvasToolbar } from '../toolbar/CanvasToolbar.tsx';
import './route.css';

export const Route = createFileRoute('/')({
  component: CanvasRoute,
});

function CanvasRoute() {
  useKeyboardShortcuts();
  useLayoutEffect(() => {
    void fetchTheme().then((theme) => {
      useEditorStore.getState().applyInitialThemeFromServer(theme);
    });
  }, []);
  useEffect(() => {
    void useImportedComponentsStore.getState().load();
  }, []);
  // Subscribing only to the ordered id list keeps the route stable across
  // drags and prop edits; each PreviewWrapper subscribes to its own instance.
  const instanceIds = useOrderedInstanceIds();
  return (
    <ContextMenuProvider>
      <div className="route-shell">
        <LayersSidebar />
        <div className="route-canvas">
          <Canvas overlay={<CanvasToolbar />}>
            {instanceIds.map((id) => (
              <PreviewWrapper key={id} id={id} />
            ))}
            <TextEditLayer />
          </Canvas>
        </div>
        <Sidebar />
      </div>
    </ContextMenuProvider>
  );
}
