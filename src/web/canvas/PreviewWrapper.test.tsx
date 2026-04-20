// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { createDefaultCardInstances } from '../state/editor/instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
import { useTextEditStore } from '../state/text-edit.ts';
import { PreviewWrapper } from './PreviewWrapper.tsx';

afterEach(() => {
  cleanup();
  useTextEditStore.setState({ active: null });
});

beforeEach(() => {
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
    canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
    hoveredId: null,
    selectionRootId: null,
  });
});

describe('PreviewWrapper', () => {
  it('selects but does not start a drag for interactive descendants', () => {
    const { container } = render(
      <ContextMenuProvider>
        <PreviewWrapper id="card-1">
          <button type="button" data-preview-interactive="true">
            Editable text
          </button>
        </PreviewWrapper>
      </ContextMenuProvider>,
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Editable text' }), {
      button: 0,
      pointerId: 1,
    });

    expect(useEditorStore.getState().selectedId).toBe('card-1');
    expect(container.firstChild).not.toHaveAttribute('data-dragging');
  });

  it('reflects hover state via data-hovered when the select tool is active', () => {
    const { container } = render(
      <ContextMenuProvider>
        <PreviewWrapper id="card-1">
          <div data-testid="card-body" />
        </PreviewWrapper>
      </ContextMenuProvider>,
    );
    const wrapper = container.firstChild as HTMLElement;

    fireEvent.pointerEnter(wrapper, { pointerId: 1 });
    expect(useEditorStore.getState().hoveredId).toBe('card-1');
    expect(wrapper).toHaveAttribute('data-hovered', 'true');

    fireEvent.pointerLeave(wrapper, { pointerId: 1 });
    expect(useEditorStore.getState().hoveredId).toBeNull();
    expect(wrapper).not.toHaveAttribute('data-hovered');
  });

  it('does not set hover while a non-select tool is active', () => {
    useEditorStore.setState({ activeTool: 'rectangle' });
    const { container } = render(
      <ContextMenuProvider>
        <PreviewWrapper id="card-1">
          <div data-testid="card-body" />
        </PreviewWrapper>
      </ContextMenuProvider>,
    );
    fireEvent.pointerEnter(container.firstChild as HTMLElement, { pointerId: 1 });
    expect(useEditorStore.getState().hoveredId).toBeNull();
  });

  it('exposes data-editing and hides resize handles while the instance is in text-edit mode', () => {
    useEditorStore.setState({ selectedId: 'card-1' });
    const { container, rerender } = render(
      <ContextMenuProvider>
        <PreviewWrapper id="card-1">
          <div data-testid="card-body" />
        </PreviewWrapper>
      </ContextMenuProvider>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('data-selected', 'true');
    expect(wrapper.querySelectorAll('.preview-resize-handle').length).toBe(4);

    useTextEditStore.setState({
      active: {
        instanceId: 'card-1',
        anchorKey: 'anchor',
        baseline: 'hi',
        draft: 'hi',
        multiline: false,
        onCommit: () => undefined,
      },
    });
    rerender(
      <ContextMenuProvider>
        <PreviewWrapper id="card-1">
          <div data-testid="card-body" />
        </PreviewWrapper>
      </ContextMenuProvider>,
    );
    const edited = container.firstChild as HTMLElement;
    expect(edited).toHaveAttribute('data-editing', 'true');
    expect(edited.querySelectorAll('.preview-resize-handle').length).toBe(0);
  });
});
