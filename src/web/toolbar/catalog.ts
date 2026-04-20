import type { ComponentType } from 'react';
import type { ComponentId } from '../../shared/types.ts';
import type { CanvasTool } from '../state/editor.ts';
import {
  ButtonIcon,
  CardIcon,
  EllipseIcon,
  LandingIcon,
  RectangleIcon,
  TableIcon,
  TextIcon,
  TriangleIcon,
} from './icons.tsx';

export type ShapeToolId = Exclude<CanvasTool, 'select'>;

export type ShapeToolbarEntry = {
  tool: ShapeToolId;
  label: string;
  Icon: ComponentType;
};

/** Primary toolbar: rectangle, ellipse, triangle, text draw tools. */
export const SHAPE_TOOLBAR_ENTRIES: readonly ShapeToolbarEntry[] = [
  { tool: 'rectangle', label: 'Rectangle', Icon: RectangleIcon },
  { tool: 'ellipse', label: 'Ellipse', Icon: EllipseIcon },
  { tool: 'triangle', label: 'Triangle', Icon: TriangleIcon },
  { tool: 'text', label: 'Text', Icon: TextIcon },
];

export type InsertComponentEntry = {
  id: ComponentId;
  label: string;
  Icon: ComponentType;
};

/** Insert menu: stock components placed at viewport center (not shape primitives). */
export const INSERT_COMPONENT_ENTRIES: readonly InsertComponentEntry[] = [
  { id: 'card', label: 'Card', Icon: CardIcon },
  { id: 'button', label: 'Button', Icon: ButtonIcon },
  { id: 'table', label: 'Table', Icon: TableIcon },
  { id: 'landing', label: 'Landing page', Icon: LandingIcon },
];
