import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { orderedInstanceIds } from '../hierarchy.ts';
import {
  buildInstanceLayerForest,
  encodeLayerTreeSignature,
  type LayerNode,
  type SelectedTarget,
  selectedTargetsEqual,
} from '../layers.ts';
import type {
  ButtonProps,
  CardProps,
  ComponentInstance,
  LandingProps,
  ShapeProps,
  TableProps,
  TextPrimitiveProps,
} from '../types.ts';
import { useEditorStore } from './store.ts';

const EMPTY_THEME_COLORS: Record<string, string> = {};

/**
 * Render order: parents first, then each subtree depth-first. Children land
 * after their ancestor in the DOM so later-nested elements paint on top
 * without the canvas having to juggle z-indexes.
 */
export function useOrderedInstanceIds(): string[] {
  const orderMemoKey = useEditorStore(
    useShallow((state) =>
      state.instances.map((instance) => `${instance.id}:${instance.parentId ?? ''}`).join('|'),
    ),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: `orderMemoKey` captures the structural data that affects render order; the callback reads fresh instances from the store.
  return useMemo(() => orderedInstanceIds(useEditorStore.getState().instances), [orderMemoKey]);
}

export function useIsDropTarget(id: string): boolean {
  return useEditorStore((state) => state.dropTargetId === id);
}

export function useIsHovered(id: string): boolean {
  return useEditorStore((state) => state.hoveredId === id);
}

export function useIsSelectionRoot(id: string): boolean {
  return useEditorStore((state) => state.selectionRootId === id);
}

export function useLayerTree(): LayerNode[] {
  const layerMemoKey = useEditorStore(
    useShallow((state) => state.instances.map((i) => `${i.id}:${encodeLayerTreeSignature(i)}`).join('|')),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: `layerMemoKey` is the stable cache key for derived trees (ids + structure signatures); the callback reads fresh instances from the store.
  return useMemo(() => buildInstanceLayerForest(useEditorStore.getState().instances), [layerMemoKey]);
}

export function useInstance(id: string): ComponentInstance | null {
  return useEditorStore((state) => state.instances.find((instance) => instance.id === id) ?? null);
}

export function useInstanceFrame(id: string): { x: number; y: number; width: number; height: number } | null {
  const tuple = useEditorStore(
    useShallow((state) => {
      const inst = state.instances.find((i) => i.id === id);
      if (!inst) return null;
      return [inst.x, inst.y, inst.width, inst.height] as const;
    }),
  );
  if (!tuple) return null;
  const [x, y, width, height] = tuple;
  return { x, y, width, height };
}

export function useCardProps(id: string): CardProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'card') return null;
    return instance.props;
  });
}

export function useButtonProps(id: string): ButtonProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'button') return null;
    return instance.props;
  });
}

export function useTableProps(id: string): TableProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'table') return null;
    return instance.props;
  });
}

export function useLandingProps(id: string): LandingProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'landing') return null;
    return instance.props;
  });
}

export function useShapeProps(id: string): ShapeProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (
      !instance ||
      (instance.type !== 'rectangle' && instance.type !== 'ellipse' && instance.type !== 'triangle')
    ) {
      return null;
    }
    return instance.props;
  });
}

export function useTextPrimitiveProps(id: string): TextPrimitiveProps | null {
  return useEditorStore((state) => {
    const instance = state.instances.find((i) => i.id === id);
    if (!instance || instance.type !== 'text') return null;
    return instance.props;
  });
}

export type SelectedTargetMeta =
  | { kind: 'instance'; instanceId: string; type: ComponentInstance['type'] }
  | {
      kind: 'layer';
      instanceId: string;
      type: ComponentInstance['type'];
      layerId: string;
    };

export function useSelectedTargetMeta(): SelectedTargetMeta | null {
  return useEditorStore(
    useShallow((state): SelectedTargetMeta | null => {
      if (!state.selectedTarget) return null;
      const target = state.selectedTarget;
      const instance = state.instances.find((candidate) => candidate.id === target.instanceId);
      if (!instance) return null;
      return target.kind === 'instance'
        ? {
            kind: 'instance',
            instanceId: target.instanceId,
            type: instance.type,
          }
        : {
            kind: 'layer',
            instanceId: target.instanceId,
            type: instance.type,
            layerId: target.layerId,
          };
    }),
  );
}

export function useSelectedTarget(): SelectedTarget | null {
  return useEditorStore((state) => state.selectedTarget);
}

export function useIsSelected(id: string): boolean {
  return useEditorStore((state) => state.selectedId === id);
}

export function useUpdateProps(id: string): (patch: Record<string, unknown>) => void {
  return useMemo(
    () => (patch: Record<string, unknown>) => useEditorStore.getState().updateProps(id, patch),
    [id],
  );
}

export function useIsLayerSelected(target: SelectedTarget): boolean {
  return useEditorStore(
    useCallback(
      (state) => {
        return selectedTargetsEqual(state.selectedTarget, target);
      },
      [target],
    ),
  );
}

/** Theme color variables from the last server theme (for the color picker). */
export function useThemeColors(): Record<string, string> {
  return useEditorStore((state) => state.themeConfig?.colors ?? EMPTY_THEME_COLORS);
}
