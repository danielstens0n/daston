import {
  componentTypeLabel,
  type LayerKind,
  type LayerTemplateNode,
  STOCK_LAYER_ROOT_CHILDREN,
} from './registry/data.ts';
import type { ComponentInstance } from './types.ts';

export type { CardLayerId, LayerKind } from './registry/data.ts';
export { CARD_LAYER_SPECS, isCardLayerId } from './registry/data.ts';

export type SelectedTarget =
  | { kind: 'instance'; instanceId: string }
  | { kind: 'layer'; instanceId: string; layerId: string };

export type LayerNode = {
  id: string;
  instanceId: string;
  type: ComponentInstance['type'];
  kind: LayerKind;
  label: string;
  secondaryLabel?: string;
  selection: SelectedTarget;
  children: LayerNode[];
};

const LAYER_TREE_SEP = '\x1f';

type LayerSource = {
  type: ComponentInstance['type'];
  instanceId: string;
  definitionId?: string;
};

export function instanceSelection(instanceId: string): Extract<SelectedTarget, { kind: 'instance' }> {
  return { kind: 'instance', instanceId };
}

export function layerSelection(
  instanceId: string,
  layerId: string,
): Extract<SelectedTarget, { kind: 'layer' }> {
  return { kind: 'layer', instanceId, layerId };
}

function nodeId(selection: SelectedTarget): string {
  return selection.kind === 'instance'
    ? `${selection.instanceId}::instance`
    : `${selection.instanceId}::${selection.layerId}`;
}

function instanceToLayerSource(instance: ComponentInstance): LayerSource {
  if (instance.type === 'imported') {
    return { type: 'imported', instanceId: instance.id, definitionId: instance.definitionId };
  }
  return { type: instance.type, instanceId: instance.id };
}

function rootNode(source: LayerSource, children: LayerNode[]): LayerNode {
  const selection = instanceSelection(source.instanceId);
  return {
    id: nodeId(selection),
    instanceId: source.instanceId,
    type: source.type,
    kind: source.type === 'imported' ? 'imported' : 'component',
    label: componentTypeLabel(source.type),
    secondaryLabel:
      source.type === 'imported' && source.definitionId
        ? `${source.definitionId} · ${source.instanceId}`
        : source.instanceId,
    selection,
    children,
  };
}

function leaf(
  source: LayerSource,
  layerId: string,
  layerKind: LayerKind,
  label: string,
  children: LayerNode[] = [],
): LayerNode {
  const selection = layerSelection(source.instanceId, layerId);
  return {
    id: nodeId(selection),
    instanceId: source.instanceId,
    type: source.type,
    kind: layerKind,
    label,
    selection,
    children,
  };
}

function expandLayerTemplate(source: LayerSource, nodes: readonly LayerTemplateNode[]): LayerNode[] {
  return nodes.map((node) => {
    const children = node.children?.length ? expandLayerTemplate(source, node.children) : [];
    return leaf(source, node.id, node.kind, node.label, children);
  });
}

function injectDynamicChildren(
  instance: ComponentInstance,
  source: LayerSource,
  nodes: LayerNode[],
): LayerNode[] {
  return nodes.map((node) => {
    let children =
      node.children.length > 0 ? injectDynamicChildren(instance, source, node.children) : node.children;

    if (instance.type === 'table') {
      if (node.selection.kind === 'layer' && node.selection.layerId === 'columns') {
        children = instance.props.columns.map((_, i) =>
          leaf(source, `col-${i}`, 'tableColumn', `Column ${i + 1}`),
        );
      } else if (node.selection.kind === 'layer' && node.selection.layerId === 'rows') {
        children = instance.props.rows.map((_, i) => leaf(source, `row-${i}`, 'tableRow', `Row ${i + 1}`));
      }
    } else if (instance.type === 'landing') {
      if (node.selection.kind === 'layer' && node.selection.layerId === 'features-list') {
        children = instance.props.features.map((_, i) =>
          leaf(source, `feature-${i}`, 'landingFeature', `Feature ${i + 1}`),
        );
      }
    }

    return { ...node, children };
  });
}

export function buildLayerTree(instance: ComponentInstance): LayerNode {
  const source = instanceToLayerSource(instance);
  const template = instance.type === 'imported' ? null : STOCK_LAYER_ROOT_CHILDREN[instance.type];
  const baseChildren = template ? expandLayerTemplate(source, template) : [];
  return rootNode(source, injectDynamicChildren(instance, source, baseChildren));
}

export function encodeLayerTreeSignature(instance: ComponentInstance): string {
  if (instance.type === 'imported') {
    return `imported${LAYER_TREE_SEP}${instance.id}${LAYER_TREE_SEP}${instance.definitionId}`;
  }
  if (
    instance.type === 'rectangle' ||
    instance.type === 'ellipse' ||
    instance.type === 'triangle' ||
    instance.type === 'text'
  ) {
    return `${instance.type}${LAYER_TREE_SEP}${instance.id}`;
  }
  if (instance.type === 'table') {
    return `table${LAYER_TREE_SEP}${instance.id}${LAYER_TREE_SEP}${instance.props.columns.length}${LAYER_TREE_SEP}${instance.props.rows.length}`;
  }
  if (instance.type === 'landing') {
    return `landing${LAYER_TREE_SEP}${instance.id}${LAYER_TREE_SEP}${instance.props.features.length}`;
  }
  return `${instance.type}${LAYER_TREE_SEP}${instance.id}`;
}

export function findLayerNode(node: LayerNode, layerId: string): LayerNode | null {
  if (node.selection.kind === 'layer' && node.selection.layerId === layerId) {
    return node;
  }
  for (const child of node.children) {
    const found = findLayerNode(child, layerId);
    if (found) return found;
  }
  return null;
}

export function getLayerLabel(instance: ComponentInstance, layerId: string): string | null {
  return findLayerNode(buildLayerTree(instance), layerId)?.label ?? null;
}

export function selectedTargetsEqual(a: SelectedTarget | null, b: SelectedTarget): boolean {
  if (!a || a.kind !== b.kind || a.instanceId !== b.instanceId) return false;
  if (a.kind === 'instance' && b.kind === 'instance') return true;
  if (a.kind === 'layer' && b.kind === 'layer') return a.layerId === b.layerId;
  return false;
}
