import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Canvas } from '../canvas/Canvas.tsx';
import { useKeyboardShortcuts } from '../keyboard/useKeyboardShortcuts.ts';
import { LayersSidebar } from '../layers/LayersSidebar.tsx';
import { Button } from '../previews/Button.tsx';
import { Card } from '../previews/Card.tsx';
import { ImportedPreview } from '../previews/ImportedPreview.tsx';
import { Landing } from '../previews/Landing.tsx';
import { PreviewWrapper } from '../previews/PreviewWrapper.tsx';
import { Table } from '../previews/Table.tsx';
import { TextEditLayer } from '../previews/TextEditLayer.tsx';
import { Sidebar } from '../sidebar/Sidebar.tsx';
import { useInstance, useInstanceIds } from '../state/editor.ts';
import { useImportedComponentsStore } from '../state/imported-components.ts';
import type { ComponentInstance } from '../state/types.ts';
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
  );
}

// PreviewWrapper owns position, drag, and the rectangular selection outline
// for every type. The body inside is picked by dispatching on instance.type
// (each body subscribes to its own props by id), and the `never` default keeps
// future union members from silently rendering nothing.
function PreviewSlot({ id }: { id: string }) {
  const instance = useInstance(id);
  if (!instance) return null;
  return (
    <PreviewWrapper id={id}>
      <PreviewBody instance={instance} />
    </PreviewWrapper>
  );
}

function PreviewBody({ instance }: { instance: ComponentInstance }) {
  switch (instance.type) {
    case 'card':
      return <Card id={instance.id} />;
    case 'button':
      return <Button id={instance.id} />;
    case 'table':
      return <Table id={instance.id} />;
    case 'landing':
      return <Landing id={instance.id} />;
    case 'imported':
      return <ImportedPreview id={instance.id} />;
    default: {
      const _exhaustive: never = instance;
      return _exhaustive;
    }
  }
}
