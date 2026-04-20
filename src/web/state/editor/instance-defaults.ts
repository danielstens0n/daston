import { ACCENT_BORDER_HEX, ACCENT_HEX } from '../../../shared/chrome-colors.ts';
import type { ThemeConfig } from '../../../shared/types.ts';
import { DEFAULT_BODY_FONT_ID, DEFAULT_HEADING_FONT_ID } from '../../lib/fonts.ts';
import { getResolvedThemeConfig } from '../../lib/theme-defaults-context.ts';
import { themeFontIds } from '../../lib/theme-fonts.ts';
import type {
  ButtonProps,
  CardInstance,
  CardProps,
  LandingProps,
  ShapeProps,
  TableProps,
  TextPrimitiveProps,
} from '../types.ts';

export const DEFAULT_CARD_WIDTH = 280;
export const DEFAULT_CARD_HEIGHT = 180;
export const DEFAULT_BUTTON_WIDTH = 160;
export const DEFAULT_BUTTON_HEIGHT = 44;
export const DEFAULT_TABLE_WIDTH = 320;
export const DEFAULT_TABLE_HEIGHT = 220;
export const DEFAULT_LANDING_WIDTH = 360;
export const DEFAULT_LANDING_HEIGHT = 480;
export const DEFAULT_IMPORTED_WIDTH = 320;
export const DEFAULT_IMPORTED_HEIGHT = 220;
/** Default placement size for rectangle / ellipse / triangle tools (click-drop). */
export const DEFAULT_SHAPE_WIDTH = 160;
export const DEFAULT_SHAPE_HEIGHT = 100;
export const DEFAULT_TEXT_WIDTH = 200;
export const DEFAULT_TEXT_HEIGHT = 44;

export function baseCardProps(): CardProps {
  return {
    title: 'Card',
    body: 'A simple card preview. Double-click text to edit.',
    padding: 20,
    fill: '#ffffff',
    borderColor: '#e4e4e7',
    borderWidth: 1,
    borderRadius: 12,
    shadowEnabled: true,
    shadowColor: '#0000001a',
    shadowBlur: 12,
    shadowOffsetY: 4,
    titleColor: '#18181b',
    bodyColor: '#52525b',
    titleFont: DEFAULT_HEADING_FONT_ID,
    titleFontSize: 16,
    titleFontWeight: 600,
    titleItalic: false,
    titleDecoration: 'none',
    bodyFont: DEFAULT_BODY_FONT_ID,
    bodyFontSize: 13,
    bodyFontWeight: 400,
    bodyItalic: false,
    bodyDecoration: 'none',
  };
}

function mergeCard(base: CardProps, theme: ThemeConfig): CardProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  return {
    ...base,
    titleFont: fonts.heading,
    bodyFont: fonts.body,
    fill: c.card ?? c.background ?? base.fill,
    titleColor: c.foreground ?? base.titleColor,
    bodyColor: c.mutedForeground ?? c.foreground ?? base.bodyColor,
    borderColor: c.border ?? base.borderColor,
  };
}

function mergeButton(base: ButtonProps, theme: ThemeConfig): ButtonProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  return {
    ...base,
    labelFont: fonts.heading,
    fill: c.primary ?? base.fill,
    textColor: c.primaryForeground ?? base.textColor,
    borderColor: c.border ?? base.borderColor,
  };
}

function mergeTable(base: TableProps, theme: ThemeConfig): TableProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  return {
    ...base,
    headerFont: fonts.heading,
    bodyFont: fonts.body,
    headerFill: c.muted ?? base.headerFill,
    rowFill: c.background ?? base.rowFill,
    borderColor: c.border ?? base.borderColor,
    headerTextColor: c.foreground ?? base.headerTextColor,
    bodyTextColor: c.mutedForeground ?? c.foreground ?? base.bodyTextColor,
  };
}

function mergeLanding(base: LandingProps, theme: ThemeConfig): LandingProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  return {
    ...base,
    headingFont: fonts.heading,
    bodyFont: fonts.body,
    accentColor: c.primary ?? base.accentColor,
    pageFill: c.background ?? base.pageFill,
    heroFill: c.card ?? c.background ?? base.heroFill,
    featuresFill: c.muted ?? base.featuresFill,
  };
}

function resolveTheme(explicit?: ThemeConfig | null): ThemeConfig | null {
  if (explicit !== undefined) return explicit;
  return getResolvedThemeConfig();
}

export function createDefaultCardProps(theme?: ThemeConfig | null): CardProps {
  const base = baseCardProps();
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeCard(base, t);
}

export function createDefaultButtonProps(theme?: ThemeConfig | null): ButtonProps {
  const base: ButtonProps = {
    label: 'Button',
    labelFont: DEFAULT_HEADING_FONT_ID,
    labelFontSize: 14,
    labelFontWeight: 600,
    labelItalic: false,
    labelDecoration: 'none',
    textColor: '#ffffff',
    fill: ACCENT_HEX,
    borderColor: ACCENT_BORDER_HEX,
    borderWidth: 1,
    borderRadius: 8,
    paddingX: 20,
    paddingY: 10,
    shadowEnabled: true,
    shadowColor: '#00000026',
    shadowBlur: 8,
    shadowOffsetY: 2,
  };
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeButton(base, t);
}

export function createDefaultTableProps(theme?: ThemeConfig | null): TableProps {
  const base: TableProps = {
    showHeader: true,
    zebra: true,
    cellPadding: 10,
    headerFill: '#f4f4f5',
    rowFill: '#ffffff',
    rowFillAlt: '#fafafa',
    borderColor: '#e4e4e7',
    borderWidth: 1,
    borderRadius: 8,
    headerTextColor: '#18181b',
    bodyTextColor: '#52525b',
    headerFont: DEFAULT_HEADING_FONT_ID,
    headerFontSize: 12,
    headerFontWeight: 600,
    headerItalic: false,
    headerDecoration: 'none',
    bodyFont: DEFAULT_BODY_FONT_ID,
    bodyFontSize: 12,
    bodyFontWeight: 400,
    bodyItalic: false,
    bodyDecoration: 'none',
    columns: ['Name', 'Role', 'Status'],
    rows: [
      ['Ada', 'Engineer', 'Active'],
      ['Bob', 'Designer', 'Away'],
      ['Cara', 'PM', 'Active'],
      ['Dan', 'QA', 'Active'],
    ],
  };
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeTable(base, t);
}

export function createDefaultShapeProps(): ShapeProps {
  return {
    fill: '#e4e4e7',
    borderColor: '#a1a1aa',
    borderWidth: 1,
    borderRadius: 8,
    shadowEnabled: false,
    shadowColor: '#0000001a',
    shadowBlur: 8,
    shadowOffsetY: 4,
  };
}

export function createDefaultTextPrimitiveProps(theme?: ThemeConfig | null): TextPrimitiveProps {
  const base: TextPrimitiveProps = {
    text: 'Text',
    textColor: '#18181b',
    textAlign: 'left',
    textFont: DEFAULT_BODY_FONT_ID,
    textFontSize: 16,
    textFontWeight: 500,
    textItalic: false,
    textDecoration: 'none',
  };
  const t = resolveTheme(theme);
  if (!t) return base;
  const fonts = themeFontIds(t);
  const c = t.colors;
  return {
    ...base,
    textFont: fonts.body,
    textColor: c.foreground ?? base.textColor,
  };
}

export function createDefaultLandingProps(theme?: ThemeConfig | null): LandingProps {
  const base: LandingProps = {
    heroTitle: 'Build faster',
    heroBody: 'Ship polished UI with your design tokens.',
    ctaLabel: 'Get started',
    featuresTitle: 'Features',
    features: [
      'Theme tokens synced with your stack',
      'Preview components on the canvas',
      'Export-ready handoff',
    ],
    headingFont: DEFAULT_HEADING_FONT_ID,
    headingFontSize: 18,
    headingFontWeight: 700,
    headingItalic: false,
    headingDecoration: 'none',
    bodyFont: DEFAULT_BODY_FONT_ID,
    bodyFontSize: 13,
    bodyFontWeight: 400,
    bodyItalic: false,
    bodyDecoration: 'none',
    accentColor: ACCENT_HEX,
    pageFill: '#f7f7f8',
    heroFill: '#ffffff',
    featuresFill: '#f4f4f5',
    borderRadius: 12,
    shadowEnabled: true,
    shadowColor: '#0000001a',
    shadowBlur: 16,
    shadowOffsetY: 4,
  };
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeLanding(base, t);
}

export const defaultCard: CardInstance = {
  id: 'card-1',
  type: 'card',
  x: 120,
  y: 120,
  width: DEFAULT_CARD_WIDTH,
  height: DEFAULT_CARD_HEIGHT,
  props: createDefaultCardProps(),
};
