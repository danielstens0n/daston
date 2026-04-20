import { describe, expect, it } from 'vitest';
import { buildTypographyPartial } from './typography.ts';

describe('buildTypographyPartial', () => {
  it('maps table header weight to headerFontWeight', () => {
    expect(buildTypographyPartial('table-header', { fontWeight: 700 })).toEqual({ headerFontWeight: 700 });
  });

  it('maps text-root scope font to textFont', () => {
    expect(buildTypographyPartial('text-root', { font: 'Inter' })).toEqual({ textFont: 'Inter' });
  });

  it('returns null when patch is empty', () => {
    expect(buildTypographyPartial('landing-body', {})).toBeNull();
  });
});
