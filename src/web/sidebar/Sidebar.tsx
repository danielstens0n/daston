import { useShallow } from 'zustand/react/shallow';
import {
  type SelectedTargetMeta,
  useEditorStore,
  useInstance,
  useSelectedTargetMeta,
} from '../state/editor.ts';
import { getLayerLabel } from '../state/layers.ts';
import {
  renderImportedInstanceInspector,
  renderLayerInspector,
  renderStockInstanceInspector,
} from '../state/registry/component-registry.tsx';
import { componentTypeLabel } from '../state/registry/data.ts';
import type { ComponentInstance } from '../state/types.ts';
import { ColorField } from './fields/ColorField.tsx';
import { FieldRow } from './fields/FieldRow.tsx';
import { Section } from './fields/Section.tsx';
import './fields/fields.css';
import './sidebar.css';

function CanvasBackgroundSection() {
  const { canvasBackgroundColor, setCanvasBackgroundColor } = useEditorStore(
    useShallow((s) => ({
      canvasBackgroundColor: s.canvasBackgroundColor,
      setCanvasBackgroundColor: s.setCanvasBackgroundColor,
    })),
  );
  return (
    <Section title="Canvas">
      <FieldRow label="Background">
        <ColorField value={canvasBackgroundColor} onChange={setCanvasBackgroundColor} />
      </FieldRow>
    </Section>
  );
}

function SidebarHeader() {
  const meta = useSelectedTargetMeta();
  const layerOwner = useInstance(meta?.kind === 'layer' ? meta.instanceId : '');
  const description = describeSelection(meta, layerOwner);
  return (
    <header className="sidebar-header">
      <h2 className="sidebar-header-title">{description?.title ?? 'Inspector'}</h2>
      <p className="sidebar-header-subtitle">{description?.subtitle ?? 'Select a component to edit'}</p>
    </header>
  );
}

function SidebarInspectorBody() {
  const meta = useSelectedTargetMeta();
  if (!meta) {
    return <div className="sidebar-empty">Nothing selected.</div>;
  }
  return renderInspector(meta);
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <SidebarHeader />
      <CanvasBackgroundSection />
      <SidebarInspectorBody />
    </aside>
  );
}

function renderInspector(meta: SelectedTargetMeta) {
  if (meta.kind === 'layer') {
    return renderLayerInspector({ type: meta.type, instanceId: meta.instanceId, layerId: meta.layerId });
  }
  if (meta.type === 'imported') {
    return renderImportedInstanceInspector(meta.instanceId);
  }
  return renderStockInstanceInspector(meta.instanceId);
}

function describeSelection(
  meta: SelectedTargetMeta | null,
  layerOwner: ComponentInstance | null,
): { title: string; subtitle: string } | null {
  if (!meta) return null;
  return {
    title: describeSelectionTitle(meta, layerOwner),
    subtitle:
      meta.kind === 'instance'
        ? `${meta.type} · ${meta.instanceId}`
        : `${componentTypeLabel(meta.type)} · ${meta.instanceId}`,
  };
}

function describeSelectionTitle(meta: SelectedTargetMeta, layerOwner: ComponentInstance | null): string {
  if (meta.kind === 'instance') return componentTypeLabel(meta.type);
  if (layerOwner && layerOwner.id === meta.instanceId) {
    return getLayerLabel(layerOwner, meta.layerId) ?? 'Layer';
  }
  return 'Layer';
}
