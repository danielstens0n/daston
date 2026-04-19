import type { ComponentType } from 'react';
import type { ComponentId } from '../../shared/types.ts';
import { ButtonIcon, CardIcon, LandingIcon, PlusIcon, TableIcon } from './icons.tsx';

// Inline catalog for the floating toolbar. Duplicates (id, label) from
// `src/server/components-catalog.ts` on purpose: the web layer has no other
// need for the server catalog today, and routing this through an HTTP
// endpoint would add async + a route + a test for a list of four strings.
// If a second consumer appears, migrate both to a fetched `/api/components`.
type ToolbarItemBase = {
  label: string;
  Icon: ComponentType;
  enabled: boolean;
  // Tooltip shown on hover/focus. For disabled items we append "Coming soon"
  // so users understand why the button doesn't respond.
  tooltip: string;
  // Persistent "current tool" highlight, Figma-style. Only Card today since
  // it's the sole working tool — this becomes a real selection once there
  // is more than one tool to pick from.
  active: boolean;
};

export type ToolbarItem =
  | (ToolbarItemBase & {
      kind: 'component';
      id: ComponentId;
    })
  | (ToolbarItemBase & {
      kind: 'action';
      id: 'import';
      action: 'open-import';
    });

export const TOOLBAR_ITEMS: readonly ToolbarItem[] = [
  {
    kind: 'action',
    id: 'import',
    action: 'open-import',
    label: 'Import component',
    Icon: PlusIcon,
    enabled: true,
    tooltip: 'Import component',
    active: false,
  },
  {
    kind: 'component',
    id: 'card',
    label: 'Card',
    Icon: CardIcon,
    enabled: true,
    tooltip: 'Card',
    active: false,
  },
  {
    kind: 'component',
    id: 'button',
    label: 'Button',
    Icon: ButtonIcon,
    enabled: true,
    tooltip: 'Button',
    active: false,
  },
  {
    kind: 'component',
    id: 'table',
    label: 'Table',
    Icon: TableIcon,
    enabled: true,
    tooltip: 'Table',
    active: false,
  },
  {
    kind: 'component',
    id: 'landing',
    label: 'Landing page',
    Icon: LandingIcon,
    enabled: true,
    tooltip: 'Landing page',
    active: false,
  },
];
