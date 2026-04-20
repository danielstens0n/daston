import { componentTypeLabel } from './component-type-label.ts';
import type { ComponentInstance } from './types.ts';

export type LayerKind =
  | 'component'
  | 'group'
  | 'rectangle'
  | 'text'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'imported';

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

export const CARD_LAYER_IDS = ['surface', 'title', 'body'] as const;
export type CardLayerId = (typeof CARD_LAYER_IDS)[number];
export const CARD_LAYERS: ReadonlyArray<{
  id: CardLayerId;
  kind: Extract<LayerKind, 'rectangle' | 'text'>;
  label: string;
}> = [
  { id: 'surface', kind: 'rectangle', label: 'Surface' },
  { id: 'title', kind: 'text', label: 'Title' },
  { id: 'body', kind: 'text', label: 'Body' },
] as const;

export function isCardLayerId(layerId: string): layerId is CardLayerId {
  return CARD_LAYER_IDS.some((candidate) => candidate === layerId);
}

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

function buildCardLayers(source: LayerSource): LayerNode {
  return rootNode(
    source,
    CARD_LAYERS.map((layer) => leaf(source, layer.id, layer.kind, layer.label)),
  );
}

function buildButtonLayers(source: LayerSource): LayerNode {
  return rootNode(source, [
    leaf(source, 'surface', 'rectangle', 'Surface'),
    leaf(source, 'label', 'text', 'Label'),
  ]);
}

function buildTableLayers(source: LayerSource): LayerNode {
  return rootNode(source, [
    leaf(source, 'header', 'group', 'Header', [
      leaf(source, 'header-surface', 'rectangle', 'Header background'),
      leaf(source, 'columns', 'text', 'Column labels'),
    ]),
    leaf(source, 'body', 'group', 'Body', [leaf(source, 'rows', 'text', 'Rows')]),
  ]);
}

function buildLandingLayers(source: LayerSource): LayerNode {
  return rootNode(source, [
    leaf(source, 'hero', 'group', 'Hero', [
      leaf(source, 'hero-surface', 'rectangle', 'Hero surface'),
      leaf(source, 'hero-title', 'text', 'Hero title'),
      leaf(source, 'hero-body', 'text', 'Hero body'),
    ]),
    leaf(source, 'features', 'group', 'Features', [
      leaf(source, 'features-surface', 'rectangle', 'Features surface'),
      leaf(source, 'features-title', 'text', 'Features title'),
      leaf(source, 'features-list', 'text', 'Feature list'),
    ]),
    leaf(source, 'cta', 'group', 'CTA', [
      leaf(source, 'cta-surface', 'rectangle', 'CTA surface'),
      leaf(source, 'cta-label', 'text', 'CTA label'),
    ]),
  ]);
}

export function buildLayerTree(source: LayerSource): LayerNode {
  switch (source.type) {
    case 'card':
      return buildCardLayers(source);
    case 'button':
      return buildButtonLayers(source);
    case 'table':
      return buildTableLayers(source);
    case 'landing':
      return buildLandingLayers(source);
    case 'imported':
      return rootNode(source, []);
    default: {
      const _exhaustive: never = source.type;
      return _exhaustive;
    }
  }
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
