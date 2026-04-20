import { describe, expect, it } from 'vitest';
import { createSnapshot, mergeSnapshot, pickEditorSnapshot, snapshotsEqual } from './editor-history.ts';
import { instanceSelection } from './layers.ts';
import type { CardInstance } from './types.ts';

const seedCard: CardInstance = {
  id: 'card-1',
  type: 'card',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  props: {
    title: 'T',
    body: 'B',
    padding: 8,
    fill: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    shadowEnabled: false,
    shadowColor: '#000',
    shadowBlur: 0,
    shadowOffsetY: 0,
    titleColor: '#111',
    bodyColor: '#222',
    titleFont: 'f1',
    titleFontSize: 12,
    titleFontWeight: 400,
    titleItalic: false,
    titleDecoration: 'none',
    bodyFont: 'f2',
    bodyFontSize: 12,
    bodyFontWeight: 400,
    bodyItalic: false,
    bodyDecoration: 'none',
  },
};

describe('editor-history', () => {
  it('mergeSnapshot leaves unspecified snapshot fields unchanged', () => {
    const base = pickEditorSnapshot({
      instances: [seedCard],
      selectedId: 'card-1',
      selectedTarget: instanceSelection('card-1'),
      nextInstanceId: 2,
      clipboard: null,
      lastPasteId: null,
    });
    const merged = mergeSnapshot(base, { selectedId: null, selectedTarget: null });
    expect(merged.instances).toEqual(base.instances);
    expect(merged.nextInstanceId).toBe(2);
    expect(merged.selectedId).toBeNull();
  });

  it('snapshotsEqual detects identical snapshots', () => {
    const a = createSnapshot(
      pickEditorSnapshot({
        instances: [seedCard],
        selectedId: null,
        selectedTarget: null,
        nextInstanceId: 2,
        clipboard: null,
        lastPasteId: null,
      }),
    );
    const b = createSnapshot(
      pickEditorSnapshot({
        instances: [seedCard],
        selectedId: null,
        selectedTarget: null,
        nextInstanceId: 2,
        clipboard: null,
        lastPasteId: null,
      }),
    );
    expect(snapshotsEqual(a, b)).toBe(true);
  });
});
