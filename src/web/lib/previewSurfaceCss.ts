/** Fill CSS custom property value when the fill effect is toggled off. */
export function previewFillCss(fill: string, fillEnabled: boolean): string {
  return fillEnabled ? fill : 'transparent';
}

/** Border width CSS custom property when the border effect is toggled off. */
export function previewBorderWidthCss(width: number, borderEnabled: boolean): string {
  return borderEnabled ? `${width}px` : '0px';
}
