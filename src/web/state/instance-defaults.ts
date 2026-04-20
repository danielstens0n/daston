import { ACCENT_BORDER_HEX, ACCENT_HEX } from '../../shared/chrome-colors.ts';
import { DEFAULT_BODY_FONT_ID, DEFAULT_HEADING_FONT_ID } from '../lib/fonts.ts';
import type { ButtonProps, CardInstance, CardProps, LandingProps, TableProps } from './types.ts';

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

export function createDefaultCardProps(): CardProps {
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

export function createDefaultButtonProps(): ButtonProps {
  return {
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
}

export function createDefaultTableProps(): TableProps {
  return {
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
}

export function createDefaultLandingProps(): LandingProps {
  return {
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
