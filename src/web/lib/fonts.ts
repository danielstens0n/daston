export type FontCatalogEntry = {
  id: string;
  label: string;
  /** Full CSS font-family stack including fallbacks. */
  stack: string;
  category: 'sans' | 'serif' | 'mono' | 'system';
  /** When false, the face is not requested from Google Fonts (system stack only). */
  loadFromGoogle: boolean;
};

export const DEFAULT_HEADING_FONT_ID = 'inter';
export const DEFAULT_BODY_FONT_ID = 'inter';

export const FONTS: readonly FontCatalogEntry[] = [
  {
    id: 'inter',
    label: 'Inter',
    stack: "'Inter', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'geist',
    label: 'Geist',
    stack: "'Geist', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'roboto',
    label: 'Roboto',
    stack: "'Roboto', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    stack: "'Open Sans', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'lato',
    label: 'Lato',
    stack: "'Lato', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    stack: "'Montserrat', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'poppins',
    label: 'Poppins',
    stack: "'Poppins', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'nunito',
    label: 'Nunito',
    stack: "'Nunito', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    stack: "'Work Sans', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    stack: "'IBM Plex Sans', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'raleway',
    label: 'Raleway',
    stack: "'Raleway', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    stack: "'DM Sans', system-ui, sans-serif",
    category: 'sans',
    loadFromGoogle: true,
  },
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    stack: "'Playfair Display', Georgia, serif",
    category: 'serif',
    loadFromGoogle: true,
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    stack: "'Merriweather', Georgia, serif",
    category: 'serif',
    loadFromGoogle: true,
  },
  { id: 'lora', label: 'Lora', stack: "'Lora', Georgia, serif", category: 'serif', loadFromGoogle: true },
  {
    id: 'source-serif-4',
    label: 'Source Serif 4',
    stack: "'Source Serif 4', Georgia, serif",
    category: 'serif',
    loadFromGoogle: true,
  },
  {
    id: 'georgia',
    label: 'Georgia',
    stack: 'Georgia, "Times New Roman", Times, serif',
    category: 'system',
    loadFromGoogle: false,
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    stack: "'JetBrains Mono', ui-monospace, monospace",
    category: 'mono',
    loadFromGoogle: true,
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    stack: "'Fira Code', ui-monospace, monospace",
    category: 'mono',
    loadFromGoogle: true,
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    stack: "'IBM Plex Mono', ui-monospace, monospace",
    category: 'mono',
    loadFromGoogle: true,
  },
] as const;

const FONT_BY_ID: ReadonlyMap<string, FontCatalogEntry> = new Map(FONTS.map((f) => [f.id, f]));

export function getFontEntry(id: string): FontCatalogEntry | undefined {
  return FONT_BY_ID.get(id);
}

export function getFontStack(id: string): string {
  const entry = FONT_BY_ID.get(id);
  if (entry) return entry.stack;
  const fallback = FONT_BY_ID.get(DEFAULT_BODY_FONT_ID);
  return fallback?.stack ?? 'system-ui, sans-serif';
}

export function getFontLabel(id: string): string {
  const entry = FONT_BY_ID.get(id);
  if (entry) return entry.label;
  const fallback = FONT_BY_ID.get(DEFAULT_BODY_FONT_ID);
  return fallback?.label ?? id;
}

/** Google Fonts CSS2 `family=` segments for every catalog face that loads remotely. */
export function googleFontFamilyParams(): string[] {
  return FONTS.filter((f) => f.loadFromGoogle).map((f) => {
    const apiName = f.label.replace(/ /g, '+');
    return `family=${apiName}:wght@400;600;700`;
  });
}

/** Full stylesheet URL for `<link rel="stylesheet">` (computed from the catalog). */
export const GOOGLE_FONTS_STYLESHEET_HREF = `https://fonts.googleapis.com/css2?${googleFontFamilyParams().join('&')}&display=swap`;
