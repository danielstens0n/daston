// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Canvas } from '../canvas/Canvas.tsx';
import { InstanceIdProvider } from '../canvas/InstanceIdContext.tsx';
import { PreviewWrapper } from '../canvas/PreviewWrapper.tsx';
import { TextEditLayer } from '../canvas/TextEditLayer.tsx';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { LayersSidebar } from '../layers/LayersSidebar.tsx';
import { Sidebar } from '../sidebar/Sidebar.tsx';
import { createDefaultCardInstances } from '../state/editor/instance-defaults.ts';
import { useEditorStore } from '../state/editor.ts';
import { layerSelection } from '../state/layers.ts';
import { useTextEditStore } from '../state/text-edit.ts';
import { Card } from './Card.tsx';
import { EditableText } from './EditableText.tsx';
import { Text } from './Text.tsx';

afterEach(() => {
  cleanup();
});

function resetEditorForPreviewTests() {
  useEditorStore.setState({
    instances: [],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 1,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
}

function renderOnCanvas(node: ReactNode, instanceId: string) {
  return render(
    <ContextMenuProvider>
      <Canvas>
        <InstanceIdProvider id={instanceId}>{node}</InstanceIdProvider>
        <TextEditLayer />
      </Canvas>
    </ContextMenuProvider>,
  );
}

function renderCardSelectionShell() {
  useEditorStore.setState({
    instances: createDefaultCardInstances(null),
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 4,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
  return render(
    <ContextMenuProvider>
      <LayersSidebar />
      <Canvas>
        <PreviewWrapper id="card-1">
          <Card id="card-1" />
        </PreviewWrapper>
        <PreviewWrapper id="text-2">
          <Text id="text-2" />
        </PreviewWrapper>
        <PreviewWrapper id="text-3">
          <Text id="text-3" />
        </PreviewWrapper>
        <TextEditLayer />
      </Canvas>
      <Sidebar />
    </ContextMenuProvider>,
  );
}

describe('EditableText', () => {
  beforeEach(() => {
    useTextEditStore.setState({ active: null });
  });

  describe('single-line', () => {
    let labelId: string;

    beforeEach(() => {
      resetEditorForPreviewTests();
      useEditorStore.getState().addInstance('button', { x: 0, y: 0 });
      labelId = useEditorStore.getState().instances.find((i) => i.parentId === 'button-1')?.id ?? '';
    });

    it('commits an inline edit on blur', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(<EditableText value="Button" onChange={onChange} />, labelId);

      await user.dblClick(screen.getByText('Button'));

      const input = screen.getByDisplayValue('Button');
      fireEvent.change(input, { target: { value: 'Launch' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('Launch');
    });

    it('commits the full string when typing multiple characters', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(<EditableText value="Hi" onChange={onChange} />, labelId);

      await user.dblClick(screen.getByText('Hi'));

      const input = screen.getByDisplayValue('Hi');
      await user.type(input, ' there');
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('Hi there');
    });

    it('cancels edits on escape', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(<EditableText value="Button" onChange={onChange} />, labelId);

      await user.dblClick(screen.getByText('Button'));

      const input = screen.getByDisplayValue('Button');
      fireEvent.change(input, { target: { value: 'Launch' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Button')).toBeInTheDocument();
    });
  });

  describe('multiline', () => {
    beforeEach(() => {
      resetEditorForPreviewTests();
      useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    });

    it('uses a textarea for multiline editing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(
        <EditableText
          value="A simple card preview. Double-click text to edit."
          onChange={onChange}
          multiline
        />,
        'text-3',
      );

      await user.dblClick(screen.getByText('A simple card preview. Double-click text to edit.'));

      expect(screen.getByDisplayValue('A simple card preview. Double-click text to edit.').tagName).toBe(
        'TEXTAREA',
      );
    });

    it('selects the matching layer and updates both sidebars on text click', () => {
      renderCardSelectionShell();

      fireEvent.pointerDown(screen.getByRole('button', { name: 'Card' }), {
        button: 0,
        pointerId: 1,
      });

      expect(useEditorStore.getState().selectedTarget).toEqual(layerSelection('text-2', 'text'));
      expect(
        screen
          .getAllByRole('heading', { name: 'Text' })
          .some((el) => el.className.includes('sidebar-section-title')),
      ).toBe(true);

      const selectedRow = document.querySelector<HTMLButtonElement>('.layers-row[data-selected="true"]');
      expect(selectedRow).not.toBeNull();
      expect(selectedRow?.getAttribute('data-layer-kind')).toBe('text');
    });
  });
});
