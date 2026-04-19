// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../state/editor.ts';
import type { CardInstance } from '../state/types.ts';
import { useKeyboardShortcuts } from './useKeyboardShortcuts.ts';

function Harness() {
  useKeyboardShortcuts();
  return null;
}

const baselineA: CardInstance = {
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

const baselineB: CardInstance = { ...baselineA, id: 'b', x: 200, y: 200 };

beforeEach(() => {
  useEditorStore.setState({
    instances: [baselineA, baselineB],
    selectedId: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
});

afterEach(() => {
  cleanup();
});

describe('useKeyboardShortcuts', () => {
  it('removes the selected instance on Delete', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'Delete', bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([baselineB]);
  });

  it('removes the selected instance on Backspace', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'Backspace', bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([baselineB]);
  });

  it('clears selection on Escape', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'Escape', bubbles: true });
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
  });

  it('nudges the selected instance with arrow keys', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft', bubbles: true });
    expect(useEditorStore.getState().instances[0]).toMatchObject({ id: 'a', x: 9, y: 20 });
    fireEvent.keyDown(document.body, { key: 'ArrowUp', bubbles: true });
    expect(useEditorStore.getState().instances[0]).toMatchObject({ id: 'a', x: 9, y: 19 });
  });

  it('nudges by 10px when Shift is held', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'ArrowRight', shiftKey: true, bubbles: true });
    expect(useEditorStore.getState().instances[0]).toMatchObject({ id: 'a', x: 20, y: 20 });
  });

  it('undos on mod+z and redoes on mod+shift+z', () => {
    render(<Harness />);
    useEditorStore.getState().duplicate('a');
    expect(useEditorStore.getState().instances).toHaveLength(3);

    fireEvent.keyDown(document.body, { key: 'z', metaKey: true, bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);

    fireEvent.keyDown(document.body, { key: 'Z', metaKey: true, shiftKey: true, bubbles: true });
    expect(useEditorStore.getState().instances).toHaveLength(3);
    expect(useEditorStore.getState().instances.at(-1)).toMatchObject({ id: 'card-2', type: 'card' });
  });

  it('does not run canvas shortcuts while a text field is focused', () => {
    render(
      <>
        <Harness />
        <input className="test-sidebar-input" type="text" />
      </>,
    );
    useEditorStore.getState().select('a');
    const input = document.querySelector('.test-sidebar-input') as HTMLInputElement;
    input.focus();
    fireEvent.keyDown(input, { key: 'Delete', bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
  });

  it('does not run canvas shortcuts inside a shortcut block (e.g. modal)', () => {
    render(
      <>
        <Harness />
        <div className="test-modal" data-canvas-shortcuts-block>
          <button type="button" className="test-modal-btn">
            x
          </button>
        </div>
      </>,
    );
    useEditorStore.getState().select('a');
    const btn = document.querySelector('.test-modal-btn') as HTMLButtonElement;
    btn.focus();
    fireEvent.keyDown(btn, { key: 'Delete', bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([baselineA, baselineB]);
  });
});
