// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

describe('LayersSidebar', () => {
  it('lists every instance with front-most first and selects on row click', () => {
    render(<LayersSidebar />);

    const rows = screen.getAllByRole('button');
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

  it('shows an empty state when there are no instances', () => {
    useEditorStore.setState({ instances: [] });
    render(<LayersSidebar />);
    expect(screen.getByText('No instances on the canvas.')).toBeInTheDocument();
  });
});
