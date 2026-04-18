import { createFileRoute } from '@tanstack/react-router';
import { Canvas } from '../canvas/Canvas.tsx';
import { Card } from '../previews/Card.tsx';

export const Route = createFileRoute('/')({
  component: CanvasRoute,
});

function CanvasRoute() {
  return (
    <Canvas>
      <Card />
    </Canvas>
  );
}
