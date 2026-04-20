import {
  componentTypeLabel,
  type LayerKind,
  type LayerTemplateNode,
  STOCK_LAYER_ROOT_CHILDREN,
} from './component-registry-data.ts';
import type { ComponentInstance } from './types.ts';

export type { CardLayerId, LayerKind } from './component-registry-data.ts';
export { CARD_LAYER_SPECS, isCardLayerId } from './component-registry-data.ts';

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

export function buildLayerTree(source: LayerSource): LayerNode {
  const template = source.type === 'imported' ? null : STOCK_LAYER_ROOT_CHILDREN[source.type];
  return rootNode(source, template ? expandLayerTemplate(source, template) : []);
}

export function encodeLayerTreeSignature(instance: ComponentInstance): string {
  return instance.type === 'imported'
    ? `imported${LAYER_TREE_SEP}${instance.id}${LAYER_TREE_SEP}${instance.definitionId}`
    : `${instance.type}${LAYER_TREE_SEP}${instance.id}`;
}

export function buildLayerTreeFromSignature(signature: string): LayerNode {
  const [type, instanceId, definitionId] = signature.split(LAYER_TREE_SEP) as [
    ComponentInstance['type'],
    string,
    string | undefined,
  ];
  return buildLayerTree(
    definitionId === undefined ? { type, instanceId } : { type, instanceId, definitionId },
  );
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

export function getLayerLabel(source: LayerSource, layerId: string): string | null {
  return findLayerNode(buildLayerTree(source), layerId)?.label ?? null;
}

export function selectedTargetsEqual(a: SelectedTarget | null, b: SelectedTarget): boolean {
  if (!a || a.kind !== b.kind || a.instanceId !== b.instanceId) return false;
  if (a.kind === 'instance' && b.kind === 'instance') return true;
  if (a.kind === 'layer' && b.kind === 'layer') return a.layerId === b.layerId;
  return false;
}
