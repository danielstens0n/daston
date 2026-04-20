import { describe, expect, it } from 'vitest';
import { componentTypeLabel, STOCK_LAYER_ROOT_CHILDREN } from './data.ts';

describe('component-registry-data', () => {
  it('exposes stable display labels', () => {
    expect(componentTypeLabel('card')).toBe('Card');
    expect(componentTypeLabel('landing')).toBe('Landing page');
    expect(componentTypeLabel('rectangle')).toBe('Rectangle');
    expect(componentTypeLabel('text')).toBe('Text');
    expect(componentTypeLabel('imported')).toBe('Imported');
  });

  it('omits card and button from template layers (nested instances replace templates)', () => {
    expect(STOCK_LAYER_ROOT_CHILDREN.card).toBeUndefined();
    expect(STOCK_LAYER_ROOT_CHILDREN.button).toBeUndefined();
  });
});
