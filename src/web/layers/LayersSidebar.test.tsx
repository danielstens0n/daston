// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { createDefaultTableProps } from '../state/editor/instance-defaults.ts';
import { useEditorStore } from '../state/editor.ts';
import { instanceSelection, layerSelection } from '../state/layers.ts';
import type { CardInstance, TableInstance } from '../state/types.ts';
import { LayersSidebar } from './LayersSidebar.tsx';

afterEach(() => {
  cleanup();
});

const cardA: CardInstance = {
  id: 'a',
  type: 'card',
  x: 10,
  y: 20,
  width: 280,
  height: 180,
  parentId: null,
  props: {
    padding: 20,
    fill: '#ffffff',
    borderColor: '#e4e4e7',
    borderWidth: 1,
    borderRadius: 12,
    shadowEnabled: true,
    shadowColor: '#0000001a',
    shadowBlur: 12,
    shadowOffsetY: 4,
    title: 'Card',
    body: 'Card body',
    titleColor: '#18181b',
    bodyColor: '#52525b',
    titleFont: 'inter',
    titleFontSize: 16,
    titleFontWeight: 600,
    titleItalic: false,
    titleDecoration: 'none',
    bodyFont: 'inter',
    bodyFontSize: 13,
    bodyFontWeight: 400,
    bodyItalic: false,
    bodyDecoration: 'none',
  },
};

const cardB: CardInstance = { ...cardA, id: 'b', x: 200, y: 200 };

beforeEach(() => {
  useEditorStore.setState({
    instances: [cardA, cardB],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 3,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
});

function renderLayersSidebar() {
  return render(
    <ContextMenuProvider>
      <LayersSidebar />
    </ContextMenuProvider>,
  );
}

describe('LayersSidebar', () => {
  it('lists every instance as a nested tree with front-most roots first', () => {
    renderLayersSidebar();

    const list = screen.getByRole('list', { name: 'Layers tree' });
    const rows = Array.from(list.querySelectorAll<HTMLButtonElement>('.layers-row'));
    expect(rows).toHaveLength(8);
    const frontRoot = rows.at(0);
    const backRoot = rows.at(4);
    if (frontRoot === undefined || backRoot === undefined) {
      throw new Error('expected root rows');
    }
    expect(within(frontRoot).getByText('b')).toBeInTheDocument();
    expect(within(backRoot).getByText('a')).toBeInTheDocument();
    expect(screen.getAllByText('Surface')).toHaveLength(2);
    expect(screen.getAllByText('Title')).toHaveLength(2);
    expect(screen.getAllByText('Body')).toHaveLength(2);
  });

  it('selects either the component root or an internal layer row', () => {
    renderLayersSidebar();

    const list = screen.getByRole('list', { name: 'Layers tree' });
    const rows = Array.from(list.querySelectorAll<HTMLButtonElement>('.layers-row'));
    const rootRow = rows.at(0);
    const titleRow = rows.at(2);
    if (!rootRow || !titleRow) throw new Error('expected root and title rows');

    fireEvent.click(rootRow);
    expect(useEditorStore.getState().selectedId).toBe('b');
    expect(useEditorStore.getState().selectedTarget).toEqual(instanceSelection('b'));

    fireEvent.click(titleRow);
    expect(useEditorStore.getState().selectedId).toBe('b');
    expect(useEditorStore.getState().selectedTarget).toEqual(layerSelection('b', 'title'));
  });

  it('can collapse component rows independently and restore them', () => {
    renderLayersSidebar();

    expect(screen.getAllByText('Title')).toHaveLength(2);
    const collapseButton = screen.getAllByRole('button', { name: 'Collapse Card' }).at(0);
    if (!collapseButton) throw new Error('expected collapse button');
    fireEvent.click(collapseButton);
    expect(screen.getAllByText('Title')).toHaveLength(1);

    const expandButton = screen.getByRole('button', { name: 'Expand Card' });
    fireEvent.click(expandButton);
    expect(screen.getAllByText('Title')).toHaveLength(2);
  });

  it('collapses into a slim rail and can expand again', () => {
    renderLayersSidebar();

    const collapseButton = screen.getByRole('button', { name: 'Collapse layers sidebar' });
    fireEvent.click(collapseButton);
    expect(screen.queryByRole('list', { name: 'Layers tree' })).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: 'Expand layers sidebar' });
    fireEvent.click(expandButton);
    expect(screen.getByRole('list', { name: 'Layers tree' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no instances', () => {
    useEditorStore.setState({ instances: [], selectedTarget: null });
    renderLayersSidebar();
    expect(screen.getByText('No instances on the canvas.')).toBeInTheDocument();
  });

  it('table Columns row context menu includes Add column', () => {
    const table: TableInstance = {
      id: 'table-1',
      type: 'table',
      x: 0,
      y: 0,
      width: 320,
      height: 220,
      parentId: null,
      props: createDefaultTableProps(),
    };
    useEditorStore.setState({ instances: [table], selectedTarget: null });
    renderLayersSidebar();

    const columnsLabel = screen.getByText('Columns');
    const rowButton = columnsLabel.closest('button');
    if (!rowButton) throw new Error('expected columns row button');

    fireEvent.contextMenu(rowButton, { clientX: 50, clientY: 50, bubbles: true });
    expect(screen.getByRole('menuitem', { name: 'Add column' })).toBeInTheDocument();
  });

  it('opens context menu on a child row and deletes the owning instance', () => {
    renderLayersSidebar();

    const list = screen.getByRole('list', { name: 'Layers tree' });
    const rows = Array.from(list.querySelectorAll<HTMLButtonElement>('.layers-row'));
    const titleRow = rows.at(2);
    if (!titleRow) throw new Error('expected title row');

    fireEvent.contextMenu(titleRow, { clientX: 50, clientY: 50, bubbles: true });
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(useEditorStore.getState().instances).toHaveLength(1);
    expect(useEditorStore.getState().instances[0]?.id).toBe('a');
  });

  it('drags a root row onto another to reparent it', () => {
    renderLayersSidebar();

    const list = screen.getByRole('list', { name: 'Layers tree' });
    const shells = Array.from(list.querySelectorAll<HTMLElement>(':scope > li > .layers-row-shell'));
    const topShell = shells.at(0);
    const bottomShell = shells.at(1);
    if (!topShell || !bottomShell) throw new Error('expected two root shells');
    bottomShell.getBoundingClientRect = rectAt(100, 40);

    const dataTransfer = makeDataTransfer();

    dispatchDragEvent('dragstart', topShell, { clientY: 0, dataTransfer });
    dispatchDragEvent('dragover', bottomShell, { clientY: 120, dataTransfer });
    dispatchDragEvent('drop', bottomShell, { clientY: 120, dataTransfer });

    const moved = useEditorStore.getState().instances.find((i) => i.id === 'b');
    expect(moved?.parentId).toBe('a');
  });

  it('drops a sibling-child onto another sibling center — reorders, never reparents', () => {
    // Two children under a shared parent. When the user drags one onto its
    // sibling, the middle "onto" zone should collapse to nearest-edge so the
    // drop reorders z-index instead of nesting a sibling into its sibling
    // (which is almost never the user's intent).
    const c1: CardInstance = { ...cardA, id: 'c1', parentId: 'a', x: 20, y: 20 };
    const c2: CardInstance = { ...cardA, id: 'c2', parentId: 'a', x: 40, y: 40 };
    useEditorStore.setState({ instances: [cardA, c1, c2], selectedTarget: null });

    renderLayersSidebar();
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.layers-row-shell'));
    const rowFor = (id: string) =>
      rows.find((r) => r.querySelector('.layers-row-secondary')?.textContent === id);
    const c1Row = rowFor('c1');
    const c2Row = rowFor('c2');
    if (!c1Row || !c2Row) throw new Error('expected child shells');

    c2Row.getBoundingClientRect = rectAt(100, 40);
    const dataTransfer = makeDataTransfer();

    // Drop in the lower half of c2 (previously "onto" → reparent). Now it
    // resolves to "below" because the target is a direct sibling.
    dispatchDragEvent('dragstart', c1Row, { clientY: 0, dataTransfer });
    dispatchDragEvent('dragover', c2Row, { clientY: 128, dataTransfer });
    dispatchDragEvent('drop', c2Row, { clientY: 128, dataTransfer });

    const c1After = useEditorStore.getState().instances.find((i) => i.id === 'c1');
    expect(c1After?.parentId).toBe('a');
    const ids = useEditorStore.getState().instances.map((i) => i.id);
    expect(ids.indexOf('c1')).toBeGreaterThan(ids.indexOf('c2'));
  });
});

function rectAt(top: number, height: number): () => DOMRect {
  return () => ({
    top,
    bottom: top + height,
    left: 0,
    right: 200,
    width: 200,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

function makeDataTransfer() {
  return {
    data: new Map<string, string>(),
    setData(type: string, value: string) {
      this.data.set(type, value);
    },
    getData(type: string) {
      return this.data.get(type) ?? '';
    },
    dropEffect: 'none',
    effectAllowed: 'none',
  };
}

// jsdom's synthetic drag events don't carry MouseEvent fields like clientY, so
// we dispatch a native Event with them manually defined.
function dispatchDragEvent(
  type: string,
  target: HTMLElement,
  init: { clientY: number; dataTransfer: unknown },
) {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'clientY', { value: init.clientY });
  Object.defineProperty(ev, 'clientX', { value: 0 });
  Object.defineProperty(ev, 'dataTransfer', { value: init.dataTransfer });
  target.dispatchEvent(ev);
}
