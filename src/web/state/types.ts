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

export type CardProps = LayoutProps & FillProps & BorderProps & ShadowProps & TextColorProps;

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

// The union grows as new component types land (button, table, landing). Store
// callers work against ComponentInstance; only the inspectors/renderers narrow.
export type ComponentInstance = CardInstance;
