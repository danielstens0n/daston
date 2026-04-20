import { describe, expect, it } from 'vitest';
import { buildTypographyPartial } from './typography.ts';

describe('buildTypographyPartial', () => {
  it('maps card title scope font to titleFont', () => {
    expect(buildTypographyPartial('card-title', { font: 'Inter' })).toEqual({ titleFont: 'Inter' });
  });

  it('maps table header weight to headerFontWeight', () => {
    expect(buildTypographyPartial('table-header', { fontWeight: 700 })).toEqual({ headerFontWeight: 700 });
  });

  it('returns null when patch is empty', () => {
    expect(buildTypographyPartial('landing-body', {})).toBeNull();
  });
});
