// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContextMenuProvider } from '../context-menu/ContextMenu.tsx';
import { createDefaultCardInstances } from '../state/editor/instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
import { PreviewWrapper } from './PreviewWrapper.tsx';

afterEach(() => {
  cleanup();
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
});
