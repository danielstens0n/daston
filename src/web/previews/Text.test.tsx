// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InstanceIdProvider } from '../canvas/InstanceIdContext.tsx';
import { createDefaultTextPrimitiveProps } from '../state/editor/instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
import { Text } from './Text.tsx';

const OriginalResizeObserver = globalThis.ResizeObserver;

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = OriginalResizeObserver;
});

beforeEach(() => {
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe(el: Element) {
      Object.defineProperty(el, 'scrollHeight', { value: 200, configurable: true, writable: true });
      Object.defineProperty(el, 'scrollWidth', { value: 180, configurable: true, writable: true });
      queueMicrotask(() => {
        this.cb([], this as unknown as ResizeObserver);
      });
    }
    disconnect() {}
    unobserve() {}
  } as unknown as typeof ResizeObserver;

  useEditorStore.setState({
    instances: [
      {
        id: 'text-1',
        type: 'text',
        x: 0,
        y: 0,
        width: 200,
        height: 44,
        parentId: null,
        props: {
          ...createDefaultTextPrimitiveProps(null),
          textAutoResize: 'height',
        },
      },
    ],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
    canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
    activeTool: 'select',
    pendingTextEditInstanceId: null,
    dropTargetId: null,
  });
});

describe('Text preview', () => {
  it('sets vertical alignment and case as CSS variables on the root', () => {
    useEditorStore.getState().updateProps('text-1', {
      textVerticalAlign: 'middle',
      textCase: 'upper',
    });
    const { container } = render(
      <InstanceIdProvider id="text-1">
        <Text id="text-1" />
      </InstanceIdProvider>,
    );
    const root = container.querySelector('.preview-text-root');
    expect(root).toBeTruthy();
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('--text-valign: center');
    expect(style).toContain('--text-transform: uppercase');
  });

  it('sets ellipsis data attribute and line clamp when overflow is ellipsis', () => {
    useEditorStore.getState().updateProps('text-1', {
      textOverflow: 'ellipsis',
      textLineHeight: 1,
      textFontSize: 10,
    });
    useEditorStore.setState({
      instances: [
        {
          id: 'text-1',
          type: 'text',
          x: 0,
          y: 0,
          width: 200,
          height: 48,
          parentId: null,
          props: {
            ...createDefaultTextPrimitiveProps(null),
            textOverflow: 'ellipsis',
            textLineHeight: 1,
            textFontSize: 10,
          },
        },
      ],
    });
    const { container } = render(
      <InstanceIdProvider id="text-1">
        <Text id="text-1" />
      </InstanceIdProvider>,
    );
    const root = container.querySelector('.preview-text-root');
    expect(root).toHaveAttribute('data-text-overflow', 'ellipsis');
    const style = root?.getAttribute('style') ?? '';
    expect(style).toContain('--text-line-clamp');
  });

  it('updates instance height from measured content when textAutoResize is height', async () => {
    render(
      <InstanceIdProvider id="text-1">
        <Text id="text-1" />
      </InstanceIdProvider>,
    );
    await waitFor(() => {
      expect(useEditorStore.getState().instances[0]?.height).toBe(208);
    });
  });
});
