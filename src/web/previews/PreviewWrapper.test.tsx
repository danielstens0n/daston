// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../state/editor.ts';
import { PreviewWrapper } from './PreviewWrapper.tsx';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  useEditorStore.setState({
    instances: [
      {
        id: 'card-1',
        type: 'card',
        x: 10,
        y: 20,
        width: 280,
        height: 180,
        props: {
          title: 'Card',
          body: 'Body',
          padding: 20,
          fill: '#ffffff',
          borderColor: '#e4e4e7',
          borderWidth: 1,
          borderRadius: 12,
          shadowEnabled: true,
          shadowColor: '#0000001a',
          shadowBlur: 12,
          shadowOffsetY: 4,
          titleColor: '#18181b',
          bodyColor: '#52525b',
        },
      },
    ],
    selectedId: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
});

describe('PreviewWrapper', () => {
  it('selects but does not start a drag for interactive descendants', () => {
    const { container } = render(
      <PreviewWrapper id="card-1">
        <button type="button" data-preview-interactive="true">
          Editable text
        </button>
      </PreviewWrapper>,
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Editable text' }), {
      button: 0,
      pointerId: 1,
    });

    expect(useEditorStore.getState().selectedId).toBe('card-1');
    expect(container.firstChild).not.toHaveAttribute('data-dragging');
  });
});
