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
    bodyFont: 'inter',
  },
};

const cardB: CardInstance = { ...cardA, id: 'b', x: 200, y: 200 };

beforeEach(() => {
  useEditorStore.setState({
    instances: [cardA, cardB],
    selectedId: null,
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
  it('lists every instance with front-most first and selects on row click', () => {
    renderLayersSidebar();

    const list = screen.getByRole('list');
    const rows = within(list).getAllByRole('button');
    expect(rows).toHaveLength(2);
    const frontRow = rows.at(0);
    const backRow = rows.at(1);
    if (frontRow === undefined || backRow === undefined) {
      throw new Error('expected two layer rows');
    }
    expect(within(frontRow).getByText('b')).toBeInTheDocument();
    expect(within(backRow).getByText('a')).toBeInTheDocument();

    fireEvent.click(frontRow);
    expect(useEditorStore.getState().selectedId).toBe('b');

    fireEvent.click(backRow);
    expect(useEditorStore.getState().selectedId).toBe('a');
  });

  it('collapses into a slim rail and can expand again', () => {
    renderLayersSidebar();

    const collapseButton = screen.getByRole('button', { name: 'Collapse layers sidebar' });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(collapseButton);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: 'Expand layers sidebar' });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expandButton);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('shows an empty state when there are no instances', () => {
    useEditorStore.setState({ instances: [] });
    renderLayersSidebar();
    expect(screen.getByText('No instances on the canvas.')).toBeInTheDocument();
  });

  it('opens context menu on row right-click and deletes from the menu', () => {
    renderLayersSidebar();

    const list = screen.getByRole('list');
    const rows = within(list).getAllByRole('button');
    const frontRow = rows.at(0);
    if (!frontRow) throw new Error('expected layer row');

    fireEvent.contextMenu(frontRow, { clientX: 50, clientY: 50, bubbles: true });
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ }));

    expect(useEditorStore.getState().instances).toHaveLength(1);
    expect(useEditorStore.getState().instances[0]?.id).toBe('a');
  });
});
