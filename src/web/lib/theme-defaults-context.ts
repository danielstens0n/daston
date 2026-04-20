import type { ThemeConfig } from '../../shared/types.ts';

let resolvedTheme: ThemeConfig | null = null;

export function setResolvedThemeConfig(theme: ThemeConfig | null): void {
  resolvedTheme = theme;
}

export function getResolvedThemeConfig(): ThemeConfig | null {
  return resolvedTheme;
}
