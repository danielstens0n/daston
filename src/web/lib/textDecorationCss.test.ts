import { describe, expect, it } from 'vitest';
import { textDecorationLineCss } from './textDecorationCss.ts';

describe('textDecorationLineCss', () => {
  it('maps strikethrough to line-through', () => {
    expect(textDecorationLineCss('strikethrough')).toBe('line-through');
  });

  it('passes through underline and none', () => {
    expect(textDecorationLineCss('underline')).toBe('underline');
    expect(textDecorationLineCss('none')).toBe('none');
  });
});
