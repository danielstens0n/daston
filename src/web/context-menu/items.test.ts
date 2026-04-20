// @vitest-environment node

import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultTableProps } from '../state/editor/instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
import { layerSelection } from '../state/layers.ts';
import type { TableInstance } from '../state/types.ts';
import { buildLayerMenuItems } from './items.ts';

const tableInstance: TableInstance = {
  id: 'table-1',
  type: 'table',
  x: 0,
  y: 0,
  width: 320,
  height: 220,
  parentId: null,
  props: createDefaultTableProps(),
};

beforeEach(() => {
  useEditorStore.setState({
    instances: [tableInstance],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
    canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
  });
});

function firstAction(label: string) {
  const items = buildLayerMenuItems(layerSelection('table-1', 'col-0'));
  const found = items.find((i) => i.kind === 'action' && i.label === label);
  if (!found || found.kind !== 'action') throw new Error(`missing menu: ${label}`);
  return found;
}

describe('buildLayerMenuItems', () => {
  it('inserts a column when Add column after runs', () => {
    firstAction('Add column after').onSelect();
    const t = useEditorStore.getState().instances[0];
    if (t?.type !== 'table') throw new Error('expected table');
    expect(t.props.columns).toHaveLength(4);
    expect(useEditorStore.getState().selectedTarget).toEqual({
      kind: 'layer',
      instanceId: 'table-1',
      layerId: 'col-1',
    });
  });

  it('disables Delete column when only one column remains', () => {
    const oneCol: TableInstance = {
      ...tableInstance,
      props: {
        ...createDefaultTableProps(),
        columns: ['Only'],
        rows: [['a']],
      },
    };
    useEditorStore.setState({ instances: [oneCol] });
    const deleteItem = buildLayerMenuItems(layerSelection('table-1', 'col-0')).find(
      (i) => i.kind === 'action' && i.label === 'Delete column',
    );
    expect(deleteItem?.kind).toBe('action');
    if (deleteItem?.kind === 'action') expect(deleteItem.disabled).toBe(true);
  });

  it('adds a row from the rows group menu', () => {
    const addRow = buildLayerMenuItems(layerSelection('table-1', 'rows')).find(
      (i) => i.kind === 'action' && i.label === 'Add row',
    );
    if (!addRow || addRow.kind !== 'action') throw new Error('missing Add row');
    addRow.onSelect();
    const t = useEditorStore.getState().instances[0];
    if (t?.type !== 'table') throw new Error('expected table');
    expect(t.props.rows).toHaveLength(5);
  });
});
