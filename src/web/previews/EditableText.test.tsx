// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Canvas } from '../canvas/Canvas.tsx';
import { useEditorStore } from '../state/editor.ts';
import { useTextEditStore } from '../state/text-edit.ts';
import { EditableText } from './EditableText.tsx';
import { TextEditLayer } from './TextEditLayer.tsx';

afterEach(() => {
  cleanup();
});

function resetEditorForPreviewTests() {
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
}

function renderOnCanvas(node: ReactNode) {
  return render(
    <Canvas>
      {node}
      <TextEditLayer />
    </Canvas>,
  );
}

describe('EditableText', () => {
  beforeEach(() => {
    useTextEditStore.setState({ active: null });
  });

  describe('single-line', () => {
    beforeEach(() => {
      resetEditorForPreviewTests();
      useEditorStore.getState().addInstance('button', { x: 0, y: 0 });
    });

    it('commits an inline edit on blur', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(<EditableText instanceId="button-1" value="Button" onChange={onChange} />);

      await user.dblClick(screen.getByText('Button'));

      const input = screen.getByDisplayValue('Button');
      fireEvent.change(input, { target: { value: 'Launch' } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('Launch');
    });

    it('commits the full string when typing multiple characters', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(<EditableText instanceId="button-1" value="Hi" onChange={onChange} />);

      await user.dblClick(screen.getByText('Hi'));

      const input = screen.getByDisplayValue('Hi');
      await user.type(input, ' there');
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith('Hi there');
    });

    it('cancels edits on escape', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderOnCanvas(<EditableText instanceId="button-1" value="Button" onChange={onChange} />);

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
        <EditableText instanceId="card-1" value="A simple card preview." onChange={onChange} multiline />,
      );

      await user.dblClick(screen.getByText('A simple card preview.'));

      expect(screen.getByDisplayValue('A simple card preview.').tagName).toBe('TEXTAREA');
    });
  });
});
