// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '../../state/editor.ts';
import { TableInspector } from './TableInspector.tsx';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useEditorStore.setState({
    instances: [],
    selectedId: null,
    nextInstanceId: 1,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
  useEditorStore.getState().addInstance('table', { x: 0, y: 0 });
});

describe('TableInspector', () => {
  it('adds a column and pads existing rows', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(<TableInspector id="table-1" onPatch={onPatch} />);

    await user.click(screen.getByRole('button', { name: 'Add column' }));

    expect(onPatch).toHaveBeenCalledWith({
      columns: ['Name', 'Role', 'Status', 'Column 4'],
      rows: [
        ['Ada', 'Engineer', 'Active', ''],
        ['Bob', 'Designer', 'Away', ''],
        ['Cara', 'PM', 'Active', ''],
        ['Dan', 'QA', 'Active', ''],
      ],
    });
  });

  it('removes a row', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(<TableInspector id="table-1" onPatch={onPatch} />);

    const removeButton = screen.getAllByRole('button', { name: 'Remove' })[3];
    if (!removeButton) throw new Error('expected a row remove button');
    await user.click(removeButton);

    expect(onPatch).toHaveBeenCalledWith({
      rows: [
        ['Bob', 'Designer', 'Away'],
        ['Cara', 'PM', 'Active'],
        ['Dan', 'QA', 'Active'],
      ],
    });
  });

  it('patches header font from typography', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(<TableInspector id="table-1" onPatch={onPatch} />);

    await user.click(screen.getByRole('button', { name: 'Table header font' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search fonts' }), 'lora');
    await user.click(screen.getByRole('option', { name: 'Lora' }));

    expect(onPatch).toHaveBeenCalledWith({ headerFont: 'lora' });
  });

  it('patches table body font weight from typography', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(<TableInspector id="table-1" onPatch={onPatch} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Table body weight' }), '700');
    expect(onPatch).toHaveBeenCalledWith({ bodyFontWeight: 700 });
  });
});
