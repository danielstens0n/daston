import { useEditorStore } from '../state/editor.ts';
import type { SelectedTarget } from '../state/layers.ts';
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

export function buildLayerMenuItems(selection: SelectedTarget): ContextMenuItem[] {
  const store = useEditorStore.getState();
  const id = selection.instanceId;
  const prefix: ContextMenuItem[] = [];

  if (selection.kind === 'layer') {
    const inst = store.instances.find((i) => i.id === id);
    if (inst?.type === 'table') {
      const { columns } = inst.props;
      if (selection.layerId === 'columns') {
        prefix.push({
          kind: 'action',
          label: 'Add column',
          onSelect: () => store.insertTableColumn(id),
        });
      }
      const colMatch = /^col-(\d+)$/.exec(selection.layerId);
      if (colMatch) {
        const idx = Number(colMatch[1]);
        const canRemoveCol = columns.length > 1;
        prefix.push(
          {
            kind: 'action',
            label: 'Add column before',
            onSelect: () => store.insertTableColumn(id, idx),
          },
          {
            kind: 'action',
            label: 'Add column after',
            onSelect: () => store.insertTableColumn(id, idx + 1),
          },
          {
            kind: 'action',
            label: 'Delete column',
            disabled: !canRemoveCol,
            onSelect: () => store.removeTableColumn(id, idx),
          },
        );
      }
      if (selection.layerId === 'rows') {
        prefix.push({
          kind: 'action',
          label: 'Add row',
          onSelect: () => store.insertTableRow(id),
        });
      }
      const rowMatch = /^row-(\d+)$/.exec(selection.layerId);
      if (rowMatch) {
        const idx = Number(rowMatch[1]);
        prefix.push(
          {
            kind: 'action',
            label: 'Add row above',
            onSelect: () => store.insertTableRow(id, idx),
          },
          {
            kind: 'action',
            label: 'Add row below',
            onSelect: () => store.insertTableRow(id, idx + 1),
          },
          {
            kind: 'action',
            label: 'Delete row',
            onSelect: () => store.removeTableRow(id, idx),
          },
        );
      }
    }
    if (inst?.type === 'landing') {
      const { features } = inst.props;
      if (selection.layerId === 'features-list') {
        prefix.push({
          kind: 'action',
          label: 'Add feature',
          onSelect: () => store.insertLandingFeature(id),
        });
      }
      const featMatch = /^feature-(\d+)$/.exec(selection.layerId);
      if (featMatch) {
        const idx = Number(featMatch[1]);
        const canRemoveFeat = features.length > 1;
        prefix.push(
          {
            kind: 'action',
            label: 'Add feature above',
            onSelect: () => store.insertLandingFeature(id, idx),
          },
          {
            kind: 'action',
            label: 'Add feature below',
            onSelect: () => store.insertLandingFeature(id, idx + 1),
          },
          {
            kind: 'action',
            label: 'Delete feature',
            disabled: !canRemoveFeat,
            onSelect: () => store.removeLandingFeature(id, idx),
          },
        );
      }
    }
  }

  const tail = buildInstanceMenuItems(id);
  if (prefix.length === 0) return tail;
  return [...prefix, { kind: 'separator' }, ...tail];
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
