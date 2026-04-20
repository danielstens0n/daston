import { ACCENT_BORDER_HEX, ACCENT_HEX } from '../../../shared/chrome-colors.ts';
import type { ThemeConfig } from '../../../shared/types.ts';
import { DEFAULT_BODY_FONT_ID, DEFAULT_HEADING_FONT_ID } from '../../lib/fonts.ts';
import { onAccentLabel, readableInkOnFill } from '../../lib/readableInkOnFill.ts';
import { getResolvedThemeConfig } from '../../lib/theme-defaults-context.ts';
import { themeFontIds } from '../../lib/theme-fonts.ts';
import type {
  ButtonProps,
  CardInstance,
  CardProps,
  ComponentInstance,
  LandingProps,
  ShapeProps,
  TableProps,
  TextPrimitiveInstance,
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

/** Vertical block for the title text instance inside a card (world units). */
export const DEFAULT_CARD_TITLE_BLOCK_HEIGHT = 28;
/** Gap between title and body text blocks inside a card. */
export const DEFAULT_CARD_TITLE_BODY_GAP = 8;

export const DEFAULT_SEED_CARD_INSTANCE_IDS = {
  root: 'card-1',
  titleText: 'text-2',
  bodyText: 'text-3',
} as const;

type WorldRect = { x: number; y: number; width: number; height: number };

export function layoutCardTextChildRects(root: {
  x: number;
  y: number;
  width: number;
  height: number;
  props: { padding: number };
}): { title: WorldRect; body: WorldRect } {
  const p = root.props.padding;
  const innerLeft = root.x + p;
  const innerTop = root.y + p;
  const innerW = Math.max(0, root.width - 2 * p);
  const titleH = DEFAULT_CARD_TITLE_BLOCK_HEIGHT;
  const gap = DEFAULT_CARD_TITLE_BODY_GAP;
  const bodyTop = innerTop + titleH + gap;
  const bodyH = Math.max(40, root.height - 2 * p - titleH - gap);
  return {
    title: { x: innerLeft, y: innerTop, width: innerW, height: titleH },
    body: { x: innerLeft, y: bodyTop, width: innerW, height: bodyH },
  };
}

export function layoutButtonLabelRect(root: {
  x: number;
  y: number;
  width: number;
  height: number;
  props: { paddingX: number; paddingY: number };
}): WorldRect {
  const { paddingX, paddingY } = root.props;
  return {
    x: root.x + paddingX,
    y: root.y + paddingY,
    width: Math.max(1, root.width - 2 * paddingX),
    height: Math.max(1, root.height - 2 * paddingY),
  };
}

export function baseCardProps(): CardProps {
  return {
    padding: 20,
    fill: '#ffffff',
    fillEnabled: true,
    borderColor: '#e4e4e7',
    borderWidth: 1,
    borderEnabled: true,
    borderRadius: 12,
    shadowEnabled: true,
    shadowColor: '#0000001a',
    shadowBlur: 12,
    shadowOffsetY: 4,
  };
}

function mergeCard(base: CardProps, theme: ThemeConfig): CardProps {
  const c = theme.colors;
  return {
    ...base,
    fill: c.card ?? c.background ?? base.fill,
    borderColor: c.border ?? base.borderColor,
  };
}

function mergeButton(base: ButtonProps, theme: ThemeConfig): ButtonProps {
  const c = theme.colors;
  return {
    ...base,
    fill: c.primary ?? base.fill,
    borderColor: c.border ?? base.borderColor,
  };
}

function mergeTable(base: TableProps, theme: ThemeConfig): TableProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  const merged: TableProps = {
    ...base,
    headerFont: fonts.heading,
    bodyFont: fonts.body,
    headerFill: c.muted ?? base.headerFill,
    rowFill: c.background ?? base.rowFill,
    borderColor: c.border ?? base.borderColor,
    headerTextColor: c.foreground ?? base.headerTextColor,
    bodyTextColor: c.mutedForeground ?? c.foreground ?? base.bodyTextColor,
  };
  return {
    ...merged,
    headerTextColor: readableInkOnFill(merged.headerFill).heading,
    bodyTextColor: readableInkOnFill(merged.rowFill).body,
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

export function baseCardTitleTextProps(): TextPrimitiveProps {
  return {
    text: 'Card',
    textColor: '#18181b',
    textAlign: 'left',
    textFont: DEFAULT_HEADING_FONT_ID,
    textFontSize: 16,
    textFontWeight: 600,
    textItalic: false,
    textDecoration: 'none',
  };
}

export function baseCardBodyTextProps(): TextPrimitiveProps {
  return {
    text: 'A simple card preview. Double-click text to edit.',
    textColor: '#52525b',
    textAlign: 'left',
    textFont: DEFAULT_BODY_FONT_ID,
    textFontSize: 13,
    textFontWeight: 400,
    textItalic: false,
    textDecoration: 'none',
  };
}

function mergeCardTitleText(base: TextPrimitiveProps, theme: ThemeConfig): TextPrimitiveProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  const cardFill =
    (typeof c.card === 'string' && c.card) ||
    (typeof c.background === 'string' && c.background) ||
    baseCardProps().fill;
  return {
    ...base,
    textFont: fonts.heading,
    textColor: c.foreground ?? readableInkOnFill(cardFill).heading,
  };
}

function mergeCardBodyText(base: TextPrimitiveProps, theme: ThemeConfig): TextPrimitiveProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  const cardFill =
    (typeof c.card === 'string' && c.card) ||
    (typeof c.background === 'string' && c.background) ||
    baseCardProps().fill;
  return {
    ...base,
    textFont: fonts.body,
    textColor: c.mutedForeground ?? c.foreground ?? readableInkOnFill(cardFill).body,
  };
}

export function createDefaultCardTitleTextProps(theme?: ThemeConfig | null): TextPrimitiveProps {
  const base = baseCardTitleTextProps();
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeCardTitleText(base, t);
}

export function createDefaultCardBodyTextProps(theme?: ThemeConfig | null): TextPrimitiveProps {
  const base = baseCardBodyTextProps();
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeCardBodyText(base, t);
}

export function createDefaultButtonProps(theme?: ThemeConfig | null): ButtonProps {
  const base: ButtonProps = {
    fill: ACCENT_HEX,
    fillEnabled: true,
    borderColor: ACCENT_BORDER_HEX,
    borderWidth: 1,
    borderEnabled: true,
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

export function baseButtonLabelTextProps(): TextPrimitiveProps {
  return {
    text: 'Button',
    textColor: '#ffffff',
    textAlign: 'center',
    textFont: DEFAULT_HEADING_FONT_ID,
    textFontSize: 14,
    textFontWeight: 600,
    textItalic: false,
    textDecoration: 'none',
  };
}

function mergeButtonLabelText(base: TextPrimitiveProps, theme: ThemeConfig): TextPrimitiveProps {
  const fonts = themeFontIds(theme);
  const c = theme.colors;
  const primary = typeof c.primary === 'string' ? c.primary : ACCENT_HEX;
  return {
    ...base,
    textFont: fonts.heading,
    textColor: c.primaryForeground ?? onAccentLabel(primary),
  };
}

export function createDefaultButtonLabelTextProps(theme?: ThemeConfig | null): TextPrimitiveProps {
  const base = baseButtonLabelTextProps();
  const t = resolveTheme(theme);
  if (!t) return base;
  return mergeButtonLabelText(base, t);
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
    borderEnabled: true,
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
    fillEnabled: true,
    borderColor: '#a1a1aa',
    borderWidth: 1,
    borderEnabled: true,
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
    featuresFill: '#e8e8ec',
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

export function createDefaultCardInstances(theme?: ThemeConfig | null): ComponentInstance[] {
  const rootProps = createDefaultCardProps(theme);
  const root: CardInstance = {
    id: DEFAULT_SEED_CARD_INSTANCE_IDS.root,
    type: 'card',
    x: 120,
    y: 120,
    width: DEFAULT_CARD_WIDTH,
    height: DEFAULT_CARD_HEIGHT,
    parentId: null,
    props: rootProps,
  };
  const rects = layoutCardTextChildRects(root);
  const title: TextPrimitiveInstance = {
    id: DEFAULT_SEED_CARD_INSTANCE_IDS.titleText,
    type: 'text',
    ...rects.title,
    parentId: root.id,
    props: createDefaultCardTitleTextProps(theme),
  };
  const body: TextPrimitiveInstance = {
    id: DEFAULT_SEED_CARD_INSTANCE_IDS.bodyText,
    type: 'text',
    ...rects.body,
    parentId: root.id,
    props: createDefaultCardBodyTextProps(theme),
  };
  return [root, title, body];
}
