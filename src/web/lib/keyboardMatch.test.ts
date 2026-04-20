// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { isEditableTarget, isShortcutBlockTarget, matchCombo } from './keyboardMatch.ts';

// Small factory — lets each test spell out exactly the keystroke it cares
// about without repeating the `new KeyboardEvent('keydown', { ... })` noise.
function keyEvent(init: KeyboardEventInit): KeyboardEvent {
  return new KeyboardEvent('keydown', init);
}

describe('matchCombo', () => {
  it('matches `mod+c` with metaKey (macOS)', () => {
    expect(matchCombo(keyEvent({ key: 'c', metaKey: true }), 'mod+c')).toBe(true);
  });

  it('matches `mod+c` with ctrlKey (non-macOS)', () => {
    expect(matchCombo(keyEvent({ key: 'c', ctrlKey: true }), 'mod+c')).toBe(true);
  });

  it('rejects `mod+c` when neither metaKey nor ctrlKey is held', () => {
    expect(matchCombo(keyEvent({ key: 'c' }), 'mod+c')).toBe(false);
  });

  it('rejects `mod+c` when shift is also held (combo does not specify shift)', () => {
    expect(matchCombo(keyEvent({ key: 'C', metaKey: true, shiftKey: true }), 'mod+c')).toBe(false);
  });

  it('rejects held-key repeats', () => {
    expect(matchCombo(keyEvent({ key: 'd', metaKey: true, repeat: true }), 'mod+d')).toBe(false);
  });

  it('rejects IME composition', () => {
    expect(matchCombo(keyEvent({ key: 'd', metaKey: true, isComposing: true }), 'mod+d')).toBe(false);
  });

  it('handles the `delete` alias', () => {
    expect(matchCombo(keyEvent({ key: 'Delete' }), 'delete')).toBe(true);
  });

  it('handles the `backspace` alias', () => {
    expect(matchCombo(keyEvent({ key: 'Backspace' }), 'backspace')).toBe(true);
  });

  it('handles `escape`', () => {
    expect(matchCombo(keyEvent({ key: 'Escape' }), 'escape')).toBe(true);
  });

  it('handles arrow keys', () => {
    expect(matchCombo(keyEvent({ key: 'ArrowLeft' }), 'arrowleft')).toBe(true);
    expect(matchCombo(keyEvent({ key: 'ArrowRight' }), 'arrowright')).toBe(true);
    expect(matchCombo(keyEvent({ key: 'ArrowUp' }), 'arrowup')).toBe(true);
    expect(matchCombo(keyEvent({ key: 'ArrowDown' }), 'arrowdown')).toBe(true);
  });

  it('handles shift+arrow combos', () => {
    expect(matchCombo(keyEvent({ key: 'ArrowLeft', shiftKey: true }), 'shift+arrowleft')).toBe(true);
    expect(matchCombo(keyEvent({ key: 'ArrowLeft' }), 'shift+arrowleft')).toBe(false);
  });

  it('compares the key case-insensitively', () => {
    expect(matchCombo(keyEvent({ key: 'D', metaKey: true }), 'mod+d')).toBe(true);
  });
});

describe('isEditableTarget', () => {
  it('is true for a text input', () => {
    const input = document.createElement('input');
    expect(isEditableTarget(input)).toBe(true);
  });

  it('is true for a textarea', () => {
    const textarea = document.createElement('textarea');
    expect(isEditableTarget(textarea)).toBe(true);
  });

  it('is true for a contenteditable div', () => {
    const div = document.createElement('div');
    div.setAttribute('contenteditable', 'true');
    expect(isEditableTarget(div)).toBe(true);
  });

  it('is false for a plain div', () => {
    expect(isEditableTarget(document.createElement('div'))).toBe(false);
  });

  it('is false for null', () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe('isShortcutBlockTarget', () => {
  it('is true inside a canvas shortcut block root', () => {
    const root = document.createElement('div');
    root.setAttribute('data-canvas-shortcuts-block', '');
    const inner = document.createElement('button');
    root.appendChild(inner);
    expect(isShortcutBlockTarget(inner)).toBe(true);
  });

  it('is false outside the block', () => {
    expect(isShortcutBlockTarget(document.createElement('div'))).toBe(false);
  });

  it('is false for null', () => {
    expect(isShortcutBlockTarget(null)).toBe(false);
  });
});
