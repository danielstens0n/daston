import type { Component, ComponentId } from '../shared/types.ts';

// Single source of truth for the stock component catalog. Used by both the
// /api/components routes and the prompt renderer in routes/prompt.ts.
// To add a new stock component: extend ComponentId in shared/types.ts and
// add its entry here.

export const COMPONENTS: readonly Component[] = [
  { id: 'button', label: 'Button', description: 'A single clickable button.' },
  { id: 'card', label: 'Card', description: 'A container with title, body, and optional actions.' },
  { id: 'table', label: 'Table', description: 'A simple data table with a header row.' },
  {
    id: 'landing',
    label: 'Landing page',
    description: 'A marketing landing page with hero, features, and CTA.',
  },
];

export function getComponent(id: string): Component | undefined {
  return COMPONENTS.find((c) => c.id === id);
}

export function isComponentId(id: unknown): id is ComponentId {
  return typeof id === 'string' && COMPONENTS.some((c) => c.id === id);
}
