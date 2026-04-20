import { describe, expect, it } from 'vitest';
import { CARD_LAYER_SPECS, componentTypeLabel, isCardLayerId, STOCK_LAYER_ROOT_CHILDREN } from './data.ts';

describe('component-registry-data', () => {
  it('exposes stable display labels', () => {
    expect(componentTypeLabel('card')).toBe('Card');
    expect(componentTypeLabel('landing')).toBe('Landing page');
    expect(componentTypeLabel('rectangle')).toBe('Rectangle');
    expect(componentTypeLabel('text')).toBe('Text');
    expect(componentTypeLabel('imported')).toBe('Imported');
  });

  it('keeps card layer ids aligned with the layer tree template', () => {
    expect(STOCK_LAYER_ROOT_CHILDREN.card).toEqual(CARD_LAYER_SPECS);
    expect(CARD_LAYER_SPECS.map((layer) => layer.id)).toEqual(['surface', 'title', 'body']);
    expect(isCardLayerId('title')).toBe(true);
    expect(isCardLayerId('unknown')).toBe(false);
  });
});
