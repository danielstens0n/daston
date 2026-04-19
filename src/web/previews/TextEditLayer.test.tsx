// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Canvas } from '../canvas/Canvas.tsx';
import { useEditorStore } from '../state/editor.ts';
import { useTextEditStore } from '../state/text-edit.ts';
import { PreviewWrapper } from './PreviewWrapper.tsx';
import { Table } from './Table.tsx';
import { TextEditLayer } from './TextEditLayer.tsx';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useTextEditStore.setState({ active: null });
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

describe('TextEditLayer', () => {
  it('hosts the editor above the table, not inside a cell', async () => {
    const user = userEvent.setup();
    render(
      <Canvas>
        <PreviewWrapper id="table-1">
          <Table id="table-1" />
        </PreviewWrapper>
        <TextEditLayer />
      </Canvas>,
    );

    await user.dblClick(screen.getByText('Ada'));

    expect(document.querySelector('.text-edit-layer-root input')).not.toBeNull();
    expect(document.querySelector('.preview-table-el input')).toBeNull();
  });
});
