import type { ComponentInstance } from '../types.ts';

export type LayerKind =
  | 'component'
  | 'group'
  | 'rectangle'
  | 'text'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'imported'
  | 'tableColumn'
  | 'tableRow'
  | 'landingFeature';

/** Declarative layer tree under the instance root; expanded in `layers.ts`. */
export type LayerTemplateNode = {
  id: string;
  kind: LayerKind;
  label: string;
  readonly children?: readonly LayerTemplateNode[];
};

/** Stock types with no template rows use `[]` or omit; card/button use real child instances. */
export const STOCK_LAYER_ROOT_CHILDREN: Partial<
  Record<Exclude<ComponentInstance['type'], 'imported'>, readonly LayerTemplateNode[]>
> = {
  rectangle: [],
  ellipse: [],
  triangle: [],
  text: [{ id: 'text', kind: 'text', label: 'Text' }],
  table: [
    {
      id: 'header',
      kind: 'group',
      label: 'Header',
      children: [
        { id: 'header-surface', kind: 'rectangle', label: 'Header background' },
        { id: 'columns', kind: 'group', label: 'Columns' },
      ],
    },
    {
      id: 'body',
      kind: 'group',
      label: 'Body',
      children: [{ id: 'rows', kind: 'group', label: 'Rows' }],
    },
  ],
  landing: [
    {
      id: 'hero',
      kind: 'group',
      label: 'Hero',
      children: [
        { id: 'hero-surface', kind: 'rectangle', label: 'Hero surface' },
        { id: 'hero-title', kind: 'text', label: 'Hero title' },
        { id: 'hero-body', kind: 'text', label: 'Hero body' },
      ],
    },
    {
      id: 'features',
      kind: 'group',
      label: 'Features',
      children: [
        { id: 'features-surface', kind: 'rectangle', label: 'Features surface' },
        { id: 'features-title', kind: 'text', label: 'Features title' },
        { id: 'features-list', kind: 'group', label: 'Features list' },
      ],
    },
    {
      id: 'cta',
      kind: 'group',
      label: 'CTA',
      children: [
        { id: 'cta-surface', kind: 'rectangle', label: 'CTA surface' },
        { id: 'cta-label', kind: 'text', label: 'CTA label' },
      ],
    },
  ],
};

export function componentTypeLabel(type: ComponentInstance['type']): string {
  switch (type) {
    case 'card':
      return 'Card';
    case 'button':
      return 'Button';
    case 'table':
      return 'Table';
    case 'landing':
      return 'Landing page';
    case 'rectangle':
      return 'Rectangle';
    case 'ellipse':
      return 'Ellipse';
    case 'triangle':
      return 'Triangle';
    case 'text':
      return 'Text';
    case 'imported':
      return 'Imported';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
