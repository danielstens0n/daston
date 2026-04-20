import { describe, expect, it } from 'vitest';
import { instanceSelection } from '../layers.ts';
import type { CardInstance } from '../types.ts';
import { createSnapshot, mergeSnapshot, pickEditorSnapshot, snapshotsEqual } from './history.ts';

const seedCard: CardInstance = {
  id: 'card-1',
  type: 'card',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  parentId: null,
  props: {
    padding: 8,
    fill: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 4,
    shadowEnabled: false,
    shadowColor: '#000',
    shadowBlur: 0,
    shadowOffsetY: 0,
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
