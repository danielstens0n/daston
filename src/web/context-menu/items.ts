import { useEditorStore } from '../state/editor.ts';
import type { ContextMenuItem } from './types.ts';

export type WorldPoint = { x: number; y: number };

function noop(): void {}

function modifierPrefix(): string {
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent)) {
    return '⌘';
  }
  return 'Ctrl+';
}

function shortcut(key: string): string {
  return `${modifierPrefix()}${key}`;
}

export function buildInstanceMenuItems(id: string): ContextMenuItem[] {
  const store = useEditorStore.getState();
  const exists = store.instances.some((i) => i.id === id);
  const hasClipboard = store.clipboard !== null;

  return [
    {
      kind: 'action',
      label: 'Copy',
      shortcut: shortcut('C'),
      disabled: !exists,
      onSelect: () => store.copy(id),
    },
    {
      kind: 'action',
      label: 'Cut',
      shortcut: shortcut('X'),
      disabled: !exists,
      onSelect: () => store.cut(id),
    },
    {
      kind: 'action',
      label: 'Paste',
      shortcut: shortcut('V'),
      disabled: !hasClipboard,
      onSelect: () => store.paste(),
    },
    {
      kind: 'action',
      label: 'Duplicate',
      shortcut: shortcut('D'),
      disabled: !exists,
      onSelect: () => store.duplicate(id),
    },
    { kind: 'separator' },
    { kind: 'action', label: 'Delete', shortcut: 'Del', disabled: !exists, onSelect: () => store.remove(id) },
  ];
}

const CANVAS_DISABLED_ACTIONS: Array<{ label: string; modKey: string }> = [
  { label: 'Copy', modKey: 'C' },
  { label: 'Cut', modKey: 'X' },
  { label: 'Duplicate', modKey: 'D' },
];

export function buildCanvasMenuItems(worldPoint: WorldPoint): ContextMenuItem[] {
  const store = useEditorStore.getState();
  const hasClipboard = store.clipboard !== null;

  return [
    ...CANVAS_DISABLED_ACTIONS.map(
      ({ label, modKey }): ContextMenuItem => ({
        kind: 'action',
        label,
        shortcut: shortcut(modKey),
        disabled: true,
        onSelect: noop,
      }),
    ),
    {
      kind: 'action',
      label: 'Paste',
      shortcut: shortcut('V'),
      disabled: !hasClipboard,
      onSelect: () => store.paste({ at: worldPoint }),
    },
    { kind: 'separator' },
    { kind: 'action', label: 'Delete', shortcut: 'Del', disabled: true, onSelect: noop },
  ];
}
