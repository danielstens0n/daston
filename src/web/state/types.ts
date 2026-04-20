// Reusable property subsets. Each corresponds to one shared inspector section
// under src/web/sidebar/sections/. New component types compose their Props from
// whichever subsets apply, then add any type-specific fields alongside.

export type FillProps = {
  fill: string;
};

export type BorderProps = {
  borderColor: string;
  borderWidth: number;
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

export type CardProps = LayoutProps &
  FillProps &
  BorderProps &
  ShadowProps &
  TextColorProps & {
    title: string;
    body: string;
    titleFont: string;
    titleFontSize: number;
    titleFontWeight: FontWeight;
    titleItalic: boolean;
    titleDecoration: TextDecoration;
    bodyFont: string;
    bodyFontSize: number;
    bodyFontWeight: FontWeight;
    bodyItalic: boolean;
    bodyDecoration: TextDecoration;
  };

// Size lives on the instance root alongside x/y — resize handles on the
// wrapper read and write width/height directly, symmetric with how drag
// updates x/y. Type-specific props stay in `props`.
export type CardInstance = {
  id: string;
  type: 'card';
  x: number;
  y: number;
  width: number;
  height: number;
  props: CardProps;
};

export type ButtonProps = FillProps &
  BorderProps &
  ShadowProps & {
    label: string;
    labelFont: string;
    labelFontSize: number;
    labelFontWeight: FontWeight;
    labelItalic: boolean;
    labelDecoration: TextDecoration;
    textColor: string;
    paddingX: number;
    paddingY: number;
  };

export type ButtonInstance = {
  id: string;
  type: 'button';
  x: number;
  y: number;
  width: number;
  height: number;
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

export type TableInstance = {
  id: string;
  type: 'table';
  x: number;
  y: number;
  width: number;
  height: number;
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

export type LandingInstance = {
  id: string;
  type: 'landing';
  x: number;
  y: number;
  width: number;
  height: number;
  props: LandingProps;
};

export type ImportedProps = Record<string, never>;

export type ImportedInstance = {
  id: string;
  type: 'imported';
  definitionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: ImportedProps;
};

/** Shared by rectangle, ellipse, triangle previews. */
export type ShapeProps = FillProps & BorderProps & ShadowProps;

export type RectangleInstance = {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  props: ShapeProps;
};

export type EllipseInstance = {
  id: string;
  type: 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  props: ShapeProps;
};

export type TriangleInstance = {
  id: string;
  type: 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  props: ShapeProps;
};

export type TextAlign = 'left' | 'center' | 'right';

export type TextPrimitiveProps = {
  text: string;
  textColor: string;
  textAlign: TextAlign;
  textFont: string;
  textFontSize: number;
  textFontWeight: FontWeight;
  textItalic: boolean;
  textDecoration: TextDecoration;
};

export type TextPrimitiveInstance = {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  height: number;
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
