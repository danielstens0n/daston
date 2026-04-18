import { createFileRoute } from '@tanstack/react-router';
import { Canvas } from '../canvas/Canvas.tsx';
import { Card } from '../previews/Card.tsx';
import { Sidebar } from '../sidebar/Sidebar.tsx';
import { useInstance, useInstanceIds } from '../state/editor.ts';
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
        <Canvas>
          {instanceIds.map((id) => (
            <PreviewSlot key={id} id={id} />
          ))}
        </Canvas>
      </div>
      <Sidebar />
    </div>
  );
}

// Preview dispatch. When ComponentInstance becomes a union of 2+ types, add
// a `default` branch with `const _: never = instance` to catch missing cases
// at compile time. With a single-variant union today, TS doesn't narrow the
// default to `never`, so the check would be noise.
function PreviewSlot({ id }: { id: string }) {
  const instance = useInstance(id);
  if (!instance) return null;
  switch (instance.type) {
    case 'card':
      return <Card instance={instance} />;
  }
}
