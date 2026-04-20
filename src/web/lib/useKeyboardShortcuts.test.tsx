// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  baseCardBodyTextProps,
  baseCardTitleTextProps,
  layoutCardTextChildRects,
} from '../state/editor/instance-defaults.ts';
import { useEditorStore } from '../state/editor.ts';
import type { CardInstance, TextPrimitiveInstance } from '../state/types.ts';
import { useKeyboardShortcuts } from './useKeyboardShortcuts.ts';

function Harness() {
  useKeyboardShortcuts();
  return null;
}

const baselineCardProps = {
  padding: 20,
  fill: '#ffffff',
  fillEnabled: true,
  borderColor: '#e4e4e7',
  borderWidth: 1,
  borderEnabled: true,
  borderRadius: 12,
  shadowEnabled: true,
  shadowColor: '#0000001a',
  shadowBlur: 12,
  shadowOffsetY: 4,
} as const satisfies CardInstance['props'];

const baselineA: CardInstance = {
  id: 'a',
  type: 'card',
  x: 10,
  y: 20,
  width: 280,
  height: 180,
  parentId: null,
  props: baselineCardProps,
};
const ra = layoutCardTextChildRects(baselineA);
const titleA: TextPrimitiveInstance = {
  id: 'a-title',
  type: 'text',
  parentId: 'a',
  ...ra.title,
  props: { ...baseCardTitleTextProps(), text: 'Card' },
};
const bodyA: TextPrimitiveInstance = {
  id: 'a-body',
  type: 'text',
  parentId: 'a',
  ...ra.body,
  props: { ...baseCardBodyTextProps(), text: 'Card body' },
};

const baselineB: CardInstance = { ...baselineA, id: 'b', x: 200, y: 200 };
const rb = layoutCardTextChildRects(baselineB);
const titleB: TextPrimitiveInstance = {
  id: 'b-title',
  type: 'text',
  parentId: 'b',
  ...rb.title,
  props: { ...baseCardTitleTextProps(), text: 'Card' },
};
const bodyB: TextPrimitiveInstance = {
  id: 'b-body',
  type: 'text',
  parentId: 'b',
  ...rb.body,
  props: { ...baseCardBodyTextProps(), text: 'Card body' },
};

const keyboardForest = [baselineA, titleA, bodyA, baselineB, titleB, bodyB] as const;

beforeEach(() => {
  useEditorStore.setState({
    instances: [...keyboardForest],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
    activeTool: 'select',
    pendingTextEditInstanceId: null,
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
    expect(useEditorStore.getState().instances).toEqual([baselineB, titleB, bodyB]);
  });

  it('removes the selected instance on Backspace', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'Backspace', bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([baselineB, titleB, bodyB]);
  });

  it('clears active draw tool on Escape before clearing selection', () => {
    render(<Harness />);
    useEditorStore.getState().setActiveTool('rectangle');
    fireEvent.keyDown(document.body, { key: 'Escape', bubbles: true });
    expect(useEditorStore.getState().activeTool).toBe('select');
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'Escape', bubbles: true });
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().instances).toEqual([...keyboardForest]);
  });

  it('clears selection on Escape when no tool is active', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'Escape', bubbles: true });
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().instances).toEqual([...keyboardForest]);
  });

  it('nudges the selected instance with arrow keys', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft', bubbles: true });
    expect(useEditorStore.getState().instances.find((i) => i.id === 'a')).toMatchObject({
      id: 'a',
      x: 9,
      y: 20,
    });
    fireEvent.keyDown(document.body, { key: 'ArrowUp', bubbles: true });
    expect(useEditorStore.getState().instances.find((i) => i.id === 'a')).toMatchObject({
      id: 'a',
      x: 9,
      y: 19,
    });
  });

  it('nudges by 10px when Shift is held', () => {
    render(<Harness />);
    useEditorStore.getState().select('a');
    fireEvent.keyDown(document.body, { key: 'ArrowRight', shiftKey: true, bubbles: true });
    expect(useEditorStore.getState().instances.find((i) => i.id === 'a')).toMatchObject({
      id: 'a',
      x: 20,
      y: 20,
    });
  });

  it('undos on mod+z and redoes on mod+shift+z', () => {
    render(<Harness />);
    useEditorStore.getState().duplicate('a');
    expect(useEditorStore.getState().instances).toHaveLength(9);

    fireEvent.keyDown(document.body, { key: 'z', metaKey: true, bubbles: true });
    expect(useEditorStore.getState().instances).toEqual([...keyboardForest]);

    fireEvent.keyDown(document.body, { key: 'Z', metaKey: true, shiftKey: true, bubbles: true });
    expect(useEditorStore.getState().instances).toHaveLength(9);
    const dup = useEditorStore.getState().instances.find((i) => i.id === 'card-2' && i.type === 'card');
    expect(dup).toMatchObject({ id: 'card-2', type: 'card' });
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
    expect(useEditorStore.getState().instances).toEqual([...keyboardForest]);
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
    expect(useEditorStore.getState().instances).toEqual([...keyboardForest]);
  });
});
