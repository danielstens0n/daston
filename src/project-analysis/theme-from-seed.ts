import type { ConfigSchemaVersion, ThemeConfig, ThemeSeed } from '../shared/types.ts';

export function themeSeedToThemeConfig(seed: ThemeSeed, version: ConfigSchemaVersion = 1): ThemeConfig {
  return {
    version,
    fonts: {
      heading: seed.fonts.heading ?? 'Inter',
      body: seed.fonts.body ?? 'Inter',
    },
    colors: { ...seed.colors },
  };
}
