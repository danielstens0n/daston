// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { useEditorStore } from '../state/editor.ts';
import type { CardInstance } from '../state/types.ts';
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
    expect(useEditorStore.getState().selectedTarget).toEqual({ kind: 'instance', instanceId: 'b' });

    fireEvent.click(titleRow);
    expect(useEditorStore.getState().selectedId).toBe('b');
    expect(useEditorStore.getState().selectedTarget).toEqual({
      kind: 'layer',
      instanceId: 'b',
      layerId: 'title',
      layerKind: 'text',
    });
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
});
