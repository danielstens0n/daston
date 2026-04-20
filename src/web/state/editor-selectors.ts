import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from './editor-store-impl.ts';
import {
  buildLayerTreeFromSignature,
  encodeLayerTreeSignature,
  type LayerNode,
  type SelectedTarget,
} from './layers.ts';
import type { ButtonProps, CardProps, ComponentInstance, LandingProps, TableProps } from './types.ts';

export function useInstanceIds(): string[] {
  return useEditorStore(useShallow((state) => state.instances.map((instance) => instance.id)));
}

export function useLayerTree(): LayerNode[] {
  const encoded = useEditorStore(useShallow((state) => state.instances.map(encodeLayerTreeSignature)));
  return encoded.map(buildLayerTreeFromSignature);
}

export function useInstance(id: string): ComponentInstance | null {
  return useEditorStore((state) => state.instances.find((instance) => instance.id === id) ?? null);
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
