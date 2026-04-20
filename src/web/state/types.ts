// Reusable property subsets. Each corresponds to one shared inspector section
// under src/web/sidebar/sections/. New component types compose their Props from
// whichever subsets apply, then add any type-specific fields alongside.

export type FillProps = {
  fill: string;
  fillEnabled: boolean;
};

export type BorderProps = {
  borderColor: string;
  borderWidth: number;
  borderEnabled: boolean;
};

export type RadiusProps = {
  borderRadius: number;
};

export type ShadowProps = {
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetY: number;
};

export type LayoutProps = {
  padding: number;
};

export type TextColorProps = {
  titleColor: string;
  bodyColor: string;
};

export type FontWeight = 400 | 500 | 600 | 700;
export type TextDecoration = 'none' | 'underline' | 'strikethrough';

/** Generic typography slice for inspector fields (maps to prefixed keys per component). */
export type TypographyValues = {
  font: string;
  fontSize: number;
  fontWeight: FontWeight;
  italic: boolean;
  decoration: TextDecoration;
};

export type CardProps = LayoutProps & FillProps & BorderProps & RadiusProps & ShadowProps;

// Shared geometry for every instance. `parentId` is `null` for roots and the
// owning instance's id for nested elements — world `x`/`y` stay absolute so
// rendering can skip ancestor lookups. Size lives on the instance root
// alongside x/y — resize handles on the wrapper read and write width/height
// directly, symmetric with how drag updates x/y. Type-specific props stay in
// `props`.
export type InstanceGeometry = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
};

export type CardInstance = InstanceGeometry & {
  type: 'card';
  props: CardProps;
};

export type ButtonProps = FillProps &
  BorderProps &
  RadiusProps &
  ShadowProps & {
    paddingX: number;
    paddingY: number;
  };

export type ButtonInstance = InstanceGeometry & {
  type: 'button';
  props: ButtonProps;
};

export type TableProps = {
  showHeader: boolean;
  zebra: boolean;
  cellPadding: number;
  headerFill: string;
  rowFill: string;
  rowFillAlt: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  borderEnabled: boolean;
  headerTextColor: string;
  bodyTextColor: string;
  headerFont: string;
  headerFontSize: number;
  headerFontWeight: FontWeight;
  headerItalic: boolean;
  headerDecoration: TextDecoration;
  bodyFont: string;
  bodyFontSize: number;
  bodyFontWeight: FontWeight;
  bodyItalic: boolean;
  bodyDecoration: TextDecoration;
  columns: string[];
  rows: string[][];
};

export type TableInstance = InstanceGeometry & {
  type: 'table';
  props: TableProps;
};

export type LandingProps = ShadowProps & {
  heroTitle: string;
  heroBody: string;
  ctaLabel: string;
  featuresTitle: string;
  features: string[];
  headingFont: string;
  headingFontSize: number;
  headingFontWeight: FontWeight;
  headingItalic: boolean;
  headingDecoration: TextDecoration;
  bodyFont: string;
  bodyFontSize: number;
  bodyFontWeight: FontWeight;
  bodyItalic: boolean;
  bodyDecoration: TextDecoration;
  accentColor: string;
  pageFill: string;
  heroFill: string;
  featuresFill: string;
  borderRadius: number;
};

export type LandingInstance = InstanceGeometry & {
  type: 'landing';
  props: LandingProps;
};

export type ImportedProps = Record<string, never>;

export type ImportedInstance = InstanceGeometry & {
  type: 'imported';
  definitionId: string;
  props: ImportedProps;
};

/** Shared by rectangle, ellipse, triangle previews. */
export type ShapeProps = FillProps & BorderProps & RadiusProps & ShadowProps;

export type RectangleInstance = InstanceGeometry & {
  type: 'rectangle';
  props: ShapeProps;
};

export type EllipseInstance = InstanceGeometry & {
  type: 'ellipse';
  props: ShapeProps;
};

export type TriangleInstance = InstanceGeometry & {
  type: 'triangle';
  props: ShapeProps;
};

export type TextAlign = 'left' | 'center' | 'right';

export type TextVerticalAlign = 'top' | 'middle' | 'bottom';

export type TextCase = 'none' | 'upper' | 'lower' | 'title';

export type TextOverflow = 'clip' | 'ellipsis';

export type TextAutoResize = 'fixed' | 'width' | 'height';

export type TextPrimitiveProps = {
  text: string;
  textColor: string;
  textAlign: TextAlign;
  textVerticalAlign: TextVerticalAlign;
  textFont: string;
  textFontSize: number;
  textFontWeight: FontWeight;
  textItalic: boolean;
  textDecoration: TextDecoration;
  /** Unitless line-height multiplier; 0 means CSS `normal` (auto). */
  textLineHeight: number;
  /** Letter spacing in px (may be negative). */
  textLetterSpacing: number;
  textCase: TextCase;
  /** Vertical gap between paragraphs (`\n\n`-delimited) in px. */
  textParagraphSpacing: number;
  textOverflow: TextOverflow;
  textAutoResize: TextAutoResize;
};

export type TextPrimitiveInstance = InstanceGeometry & {
  type: 'text';
  props: TextPrimitiveProps;
};

// The union grows as new component types land. Store callers work against
// ComponentInstance; only the inspectors/renderers narrow.
export type ComponentInstance =
  | CardInstance
  | ButtonInstance
  | TableInstance
  | LandingInstance
  | RectangleInstance
  | EllipseInstance
  | TriangleInstance
  | TextPrimitiveInstance
  | ImportedInstance;
