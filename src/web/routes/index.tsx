import { createFileRoute } from '@tanstack/react-router';
import { Canvas } from '../canvas/Canvas.tsx';
import { Card } from '../previews/Card.tsx';
import { PreviewWrapper } from '../previews/PreviewWrapper.tsx';
import { Sidebar } from '../sidebar/Sidebar.tsx';
import { useInstance, useInstanceIds } from '../state/editor.ts';
import type { ComponentInstance } from '../state/types.ts';
import { CanvasToolbar } from '../toolbar/CanvasToolbar.tsx';
import './route.css';

export const Route = createFileRoute('/')({
  component: CanvasRoute,
});

function CanvasRoute() {
  // Subscribing only to the id list keeps the route stable across drags and
  // prop edits — each PreviewSlot pulls its own instance data.
  const instanceIds = useInstanceIds();
  return (
    <div className="route-shell">
      <div className="route-canvas">
        <Canvas overlay={<CanvasToolbar />}>
          {instanceIds.map((id) => (
            <PreviewSlot key={id} id={id} />
          ))}
        </Canvas>
      </div>
      <Sidebar />
    </div>
  );
}

// PreviewWrapper owns position, drag, and the rectangular selection outline
// for every type. The body inside is picked by dispatching on instance.type
// (each body subscribes to its own props by id). When ComponentInstance
// becomes a union of 2+ types, add a `default` branch with
// `const _: never = instance` to make forgetting a case a compile error.
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
  }
}
