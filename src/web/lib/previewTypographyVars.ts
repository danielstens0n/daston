import type { FontWeight, TextDecoration } from '../state/types.ts';
import { getFontStack } from './fonts.ts';
import { textDecorationLineCss } from './textDecorationCss.ts';

export type PreviewTypographyVarNames = {
  font: string;
  size: string;
  weight: string;
  style: string;
  decorationLine: string;
};

export function previewTypographyVars(
  names: PreviewTypographyVarNames,
  fontId: string,
  fontSize: number,
  fontWeight: FontWeight,
  italic: boolean,
  decoration: TextDecoration,
): Record<string, string> {
  return {
    [names.font]: getFontStack(fontId),
    [names.size]: `${fontSize}px`,
    [names.weight]: String(fontWeight),
    [names.style]: italic ? 'italic' : 'normal',
    [names.decorationLine]: textDecorationLineCss(decoration),
  };
}
