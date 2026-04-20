// Parent/child helpers over the flat `instances` array. Instances store
// absolute world `x`/`y`; the tree is purely a z-ordering + group-move
// convenience. Every helper here is a pure read.

import type { ComponentInstance } from './types.ts';

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Walks up `parentId` from `id` and returns the chain self-first, root-last.
 * Stops at `null` or at a missing parent (treats orphans as roots). Also
 * stops if a cycle is detected, so a bad graph can't loop forever.
 */
export function ancestorChain(instances: readonly ComponentInstance[], id: string): string[] {
  const byId = new Map(instances.map((inst) => [inst.id, inst]));
  const chain: string[] = [];
  const seen = new Set<string>();
  let cursor: string | null = id;
  while (cursor !== null && !seen.has(cursor)) {
    const inst = byId.get(cursor);
    if (!inst) break;
    chain.push(cursor);
    seen.add(cursor);
    cursor = inst.parentId;
  }
  return chain;
}

/**
 * The direct child of `rootId` that sits on the ancestor chain from
 * `descendantId`. Returns `null` if `rootId` is not a strict ancestor of
 * `descendantId` (same instance or unrelated).
 */
export function childOfRootOnPath(
  instances: readonly ComponentInstance[],
  rootId: string,
  descendantId: string,
): string | null {
  const chain = ancestorChain(instances, descendantId);
  const rootIndex = chain.indexOf(rootId);
  if (rootIndex <= 0) return null;
  return chain[rootIndex - 1] ?? null;
}

export function collectDescendantIds(instances: readonly ComponentInstance[], rootId: string): Set<string> {
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const parent = stack.pop();
    if (parent === undefined) continue;
    for (const inst of instances) {
      if (inst.parentId === parent && !out.has(inst.id)) {
        out.add(inst.id);
        stack.push(inst.id);
      }
    }
  }
  return out;
}

export function collectSubtreeIds(instances: readonly ComponentInstance[], rootId: string): Set<string> {
  const out = collectDescendantIds(instances, rootId);
  out.add(rootId);
  return out;
}

// Topological render order: roots first in insertion order, each followed
// immediately by its descendant subtree. Children render after their parent
// in the DOM so they layer on top without z-index bookkeeping.
export function orderedInstanceIds(instances: readonly ComponentInstance[]): string[] {
  const knownIds = new Set(instances.map((inst) => inst.id));
  const childrenByParent = new Map<string | null, ComponentInstance[]>();
  for (const inst of instances) {
    const parentId = inst.parentId !== null && knownIds.has(inst.parentId) ? inst.parentId : null;
    const bucket = childrenByParent.get(parentId);
    if (bucket) bucket.push(inst);
    else childrenByParent.set(parentId, [inst]);
  }
  const result: string[] = [];
  const visit = (parentId: string | null) => {
    const children = childrenByParent.get(parentId);
    if (!children) return;
    for (const child of children) {
      result.push(child.id);
      visit(child.id);
    }
  };
  visit(null);
  return result;
}

/** Root first, then descendants depth-first — same order as `orderedInstanceIds` but scoped to one subtree. */
export function orderedSubtreeInstances(
  instances: readonly ComponentInstance[],
  rootId: string,
): ComponentInstance[] {
  const ids = collectSubtreeIds(instances, rootId);
  return orderedInstanceIds(instances)
    .map((id) => instances.find((i) => i.id === id))
    .filter((i): i is ComponentInstance => i !== undefined && ids.has(i.id));
}

function rectContains(rect: Rect, point: { x: number; y: number }): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

// Pick the front-most instance that contains the dragged element's center,
// excluding the dragged instance and all of its descendants (avoid cycles).
// Returns `null` when the drop would land on empty canvas — callers treat
// that as "promote to root".
export function pickDropTarget(
  instances: readonly ComponentInstance[],
  draggedId: string,
  draggedRect: Rect,
): string | null {
  const excluded = collectSubtreeIds(instances, draggedId);
  const center = {
    x: draggedRect.x + draggedRect.width / 2,
    y: draggedRect.y + draggedRect.height / 2,
  };
  const byId = new Map(instances.map((inst) => [inst.id, inst]));
  const ordered = orderedInstanceIds(instances);
  for (let i = ordered.length - 1; i >= 0; i--) {
    const id = ordered[i];
    if (!id || excluded.has(id)) continue;
    const inst = byId.get(id);
    if (inst && rectContains(inst, center)) return inst.id;
  }
  return null;
}
