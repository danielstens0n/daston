// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  createDefaultLandingProps,
  createDefaultShapeProps,
  createDefaultTableProps,
  createDefaultTextPrimitiveProps,
} from './editor/instance-defaults.ts';
import {
  buildInstanceLayerForest,
  buildLayerTree,
  encodeLayerTreeSignature,
  getLayerLabel,
} from './layers.ts';
import type { LandingInstance, RectangleInstance, TableInstance, TextPrimitiveInstance } from './types.ts';

const tableBase: Omit<TableInstance, 'props'> = {
  id: 'table-1',
  type: 'table',
  x: 0,
  y: 0,
  width: 320,
  height: 220,
  parentId: null,
};

const landingBase: Omit<LandingInstance, 'props'> = {
  id: 'landing-1',
  type: 'landing',
  x: 0,
  y: 0,
  width: 360,
  height: 480,
  parentId: null,
};

describe('buildLayerTree', () => {
  it('adds one column leaf per table column', () => {
    const props = createDefaultTableProps();
    const instance: TableInstance = { ...tableBase, props };
    const tree = buildLayerTree(instance);
    const headerNode = tree.children.find(
      (n) => n.selection.kind === 'layer' && n.selection.layerId === 'header',
    );
    const columnsNode = headerNode?.children.find(
      (n) => n.selection.kind === 'layer' && n.selection.layerId === 'columns',
    );
    expect(columnsNode?.children).toHaveLength(props.columns.length);
    expect(columnsNode?.children[0]?.selection).toEqual({
      kind: 'layer',
      instanceId: 'table-1',
      layerId: 'col-0',
    });
    expect(columnsNode?.children[0]?.kind).toBe('tableColumn');
  });

  it('adds one row leaf per table row', () => {
    const props = createDefaultTableProps();
    const instance: TableInstance = { ...tableBase, props };
    const tree = buildLayerTree(instance);
    const bodyNode = tree.children.find(
      (n) => n.selection.kind === 'layer' && n.selection.layerId === 'body',
    );
    const rowsNode = bodyNode?.children.find(
      (n) => n.selection.kind === 'layer' && n.selection.layerId === 'rows',
    );
    expect(rowsNode?.children).toHaveLength(props.rows.length);
    expect(rowsNode?.children[2]?.label).toBe('Row 3');
  });

  it('adds feature leaves from landing props length', () => {
    const props = createDefaultLandingProps();
    const instance: LandingInstance = { ...landingBase, props };
    const tree = buildLayerTree(instance);
    const featuresGroup = tree.children.find(
      (n) => n.selection.kind === 'layer' && n.selection.layerId === 'features',
    );
    const listNode = featuresGroup?.children.find(
      (n) => n.selection.kind === 'layer' && n.selection.layerId === 'features-list',
    );
    expect(listNode?.children).toHaveLength(props.features.length);
    expect(listNode?.children[1]?.label).toBe('Feature 2');
  });

  it('encodeLayerTreeSignature includes table column and row counts', () => {
    const props = createDefaultTableProps();
    const instance: TableInstance = { ...tableBase, props };
    expect(encodeLayerTreeSignature(instance)).toBe(
      `table\x1ftable-1\x1f${props.columns.length}\x1f${props.rows.length}`,
    );
  });

  it('encodeLayerTreeSignature includes landing feature count', () => {
    const props = createDefaultLandingProps();
    const instance: LandingInstance = { ...landingBase, props };
    expect(encodeLayerTreeSignature(instance)).toBe(`landing\x1flanding-1\x1f${props.features.length}`);
  });
});

describe('buildInstanceLayerForest', () => {
  it('nests child instances under their parent root and leaves roots at top level', () => {
    const parent: RectangleInstance = {
      id: 'rect-1',
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      parentId: null,
      props: createDefaultShapeProps(),
    };
    const child: TextPrimitiveInstance = {
      id: 'text-1',
      type: 'text',
      x: 20,
      y: 20,
      width: 60,
      height: 24,
      parentId: 'rect-1',
      props: createDefaultTextPrimitiveProps(null),
    };
    const unrelated: RectangleInstance = { ...parent, id: 'rect-2' };

    const forest = buildInstanceLayerForest([parent, child, unrelated]);
    expect(forest).toHaveLength(2);
    const parentNode = forest.find((node) => node.instanceId === 'rect-1');
    expect(parentNode?.children.some((node) => node.instanceId === 'text-1')).toBe(true);
  });
});

describe('getLayerLabel', () => {
  it('returns human labels for dynamic column and row ids', () => {
    const props = createDefaultTableProps();
    const instance: TableInstance = { ...tableBase, props };
    expect(getLayerLabel(instance, 'col-2')).toBe('Column 3');
    expect(getLayerLabel(instance, 'row-1')).toBe('Row 2');
  });
});
