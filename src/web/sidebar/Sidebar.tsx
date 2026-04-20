import { useShallow } from 'zustand/react/shallow';
import { type SelectedTargetMeta, useEditorStore, useSelectedTargetMeta } from '../state/editor.ts';
import { getLayerLabel } from '../state/layers.ts';
import {
  renderImportedInstanceInspector,
  renderLayerInspector,
  renderStockInstanceInspector,
} from '../state/registry/component-registry.tsx';
import { componentTypeLabel } from '../state/registry/data.ts';
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

export function Sidebar() {
  const meta = useSelectedTargetMeta();
  const description = describeSelection(meta);

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h2 className="sidebar-header-title">{description?.title ?? 'Inspector'}</h2>
        <p className="sidebar-header-subtitle">{description?.subtitle ?? 'Select a component to edit'}</p>
      </header>
      <CanvasBackgroundSection />
      {meta ? (
        renderInspector(meta, description?.title ?? 'Layer')
      ) : (
        <div className="sidebar-empty">Nothing selected.</div>
      )}
    </aside>
  );
}

function renderInspector(meta: SelectedTargetMeta, selectedLabel: string) {
  const onPatch = patcher(meta.instanceId);
  if (meta.kind === 'layer') {
    return renderLayerInspector(
      { type: meta.type, instanceId: meta.instanceId, layerId: meta.layerId },
      selectedLabel,
      onPatch,
    );
  }
  if (meta.type === 'imported') {
    return renderImportedInstanceInspector(meta.instanceId);
  }
  return renderStockInstanceInspector(meta.type, meta.instanceId, onPatch);
}

function patcher(id: string): (patch: Record<string, unknown>) => void {
  return (patch) => useEditorStore.getState().updateProps(id, patch);
}

function describeSelection(meta: SelectedTargetMeta | null): { title: string; subtitle: string } | null {
  if (!meta) return null;
  return {
    title: describeSelectionTitle(meta),
    subtitle:
      meta.kind === 'instance'
        ? `${meta.type} · ${meta.instanceId}`
        : `${componentTypeLabel(meta.type)} · ${meta.instanceId}`,
  };
}

function describeSelectionTitle(meta: SelectedTargetMeta): string {
  if (meta.kind === 'instance') return componentTypeLabel(meta.type);
  return getLayerLabel({ type: meta.type, instanceId: meta.instanceId }, meta.layerId) ?? 'Layer';
}
