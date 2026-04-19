import { describe, expect, it } from 'vitest';
import { googleFontFamilyParams } from './fonts.ts';

describe('googleFontFamilyParams', () => {
  it('requests italic and weight axes for Google-loaded families', () => {
    const params = googleFontFamilyParams();
    expect(params.length).toBeGreaterThan(0);
    for (const segment of params) {
      expect(segment).toContain(':ital,wght@0,400..700;1,400..700');
    }
  });
});
