import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildLayerTree, encodeLayerTreeSignature, type LayerNode, type SelectedTarget } from '../layers.ts';
import type { ButtonProps, CardProps, ComponentInstance, LandingProps, TableProps } from '../types.ts';
import { useEditorStore } from './store.ts';

export function useInstanceIds(): string[] {
  return useEditorStore(useShallow((state) => state.instances.map((instance) => instance.id)));
}

export function useLayerTree(): LayerNode[] {
  const layerMemoKey = useEditorStore(
    useShallow((state) => state.instances.map((i) => `${i.id}:${encodeLayerTreeSignature(i)}`).join('|')),
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: `layerMemoKey` is the stable cache key for derived trees (ids + structure signatures); the callback reads fresh instances from the store.
  return useMemo(
    () => useEditorStore.getState().instances.map((instance) => buildLayerTree(instance)),
    [layerMemoKey],
  );
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
      const instance = state.instances.find((candidate) => candidate.id === state.selectedTarget?.instanceId);
      if (!instance) return null;
      return state.selectedTarget.kind === 'instance'
        ? {
            kind: 'instance',
            instanceId: state.selectedTarget.instanceId,
            type: instance.type,
          }
        : {
            kind: 'layer',
            instanceId: state.selectedTarget.instanceId,
            type: instance.type,
            layerId: state.selectedTarget.layerId,
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

function selectedTargetKey(target: SelectedTarget): string {
  return target.kind === 'instance' ? `i:${target.instanceId}` : `l:${target.instanceId}:${target.layerId}`;
}

export function useIsLayerSelected(target: SelectedTarget): boolean {
  const key = selectedTargetKey(target);
  return useEditorStore(
    useCallback(
      (state) => {
        const sel = state.selectedTarget;
        if (!sel) return false;
        return selectedTargetKey(sel) === key;
      },
      [key],
    ),
  );
}
