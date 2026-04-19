import type { TextDecoration } from '../state/types.ts';

export function textDecorationLineCss(value: TextDecoration): string {
  if (value === 'underline') return 'underline';
  if (value === 'strikethrough') return 'line-through';
  return 'none';
}
