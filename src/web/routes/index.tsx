import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Canvas,
});

function Canvas() {
  return <div>daston canvas</div>;
}
