// Translate a visible-order drop in the layers sidebar into the array-order
// target `reorderInstance` expects. Root rows render reversed (top of sidebar
// = top of canvas z-stack = later in the array), but sublist rows render in
// array order — so "above" means different things per context.

import type { ComponentInstance } from '../state/types.ts';

export type DropZone = 'above' | 'below' | 'onto';

type ReorderTarget = {
  parentId: string | null;
  beforeId: string | null;
};

function nextSiblingIdInArray(
  instances: readonly ComponentInstance[],
  target: ComponentInstance,
): string | null {
  const start = instances.indexOf(target);
  for (let i = start + 1; i < instances.length; i++) {
    const candidate = instances[i];
    if (candidate && candidate.parentId === target.parentId) return candidate.id;
  }
  return null;
}

export function computeReorderTarget(
  instances: readonly ComponentInstance[],
  draggedId: string,
  targetId: string,
  zone: DropZone,
  isRoot: boolean,
): ReorderTarget | null {
  if (draggedId === targetId) return null;
  const target = instances.find((candidate) => candidate.id === targetId);
  if (!target) return null;
  if (zone === 'onto') {
    return { parentId: target.id, beforeId: null };
  }
  const aboveMeansBeforeTarget = !isRoot;
  const beforeId =
    zone === 'above'
      ? aboveMeansBeforeTarget
        ? target.id
        : nextSiblingIdInArray(instances, target)
      : aboveMeansBeforeTarget
        ? nextSiblingIdInArray(instances, target)
        : target.id;
  return { parentId: target.parentId, beforeId };
}
