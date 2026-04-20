import { useShallow } from 'zustand/react/shallow';
import { componentTypeLabel } from '../state/component-type-label.ts';
import { type SelectedTargetMeta, useEditorStore, useSelectedTargetMeta } from '../state/editor.ts';
import { getLayerLabel, isCardLayerId } from '../state/layers.ts';
import type { ButtonProps, CardProps, LandingProps, TableProps } from '../state/types.ts';
import { ColorField } from './fields/ColorField.tsx';
import { FieldRow } from './fields/FieldRow.tsx';
import { Section } from './fields/Section.tsx';
import { ButtonInspector } from './inspectors/ButtonInspector.tsx';
import { CardInspector } from './inspectors/CardInspector.tsx';
import { CardLayerInspector } from './inspectors/CardLayerInspector.tsx';
import { ImportedInspector } from './inspectors/ImportedInspector.tsx';
import { LandingInspector } from './inspectors/LandingInspector.tsx';
import { TableInspector } from './inspectors/TableInspector.tsx';
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

// Dispatch by selection target. Whole components keep their current
// inspectors; focused layer rows can narrow to layer-specific controls.
function renderInspector(meta: SelectedTargetMeta, selectedLabel: string) {
  if (meta.kind === 'layer') {
    if (meta.type === 'card' && isCardLayerId(meta.layerId)) {
      return (
        <CardLayerInspector
          id={meta.instanceId}
          layerId={meta.layerId}
          onPatch={patcher<CardProps>(meta.instanceId)}
        />
      );
    }
    return <LayerInspectorFallback label={selectedLabel} />;
  }

  switch (meta.type) {
    case 'card':
      return <CardInspector id={meta.instanceId} onPatch={patcher<CardProps>(meta.instanceId)} />;
    case 'button':
      return <ButtonInspector id={meta.instanceId} onPatch={patcher<ButtonProps>(meta.instanceId)} />;
    case 'table':
      return <TableInspector id={meta.instanceId} onPatch={patcher<TableProps>(meta.instanceId)} />;
    case 'landing':
      return <LandingInspector id={meta.instanceId} onPatch={patcher<LandingProps>(meta.instanceId)} />;
    case 'imported':
      return <ImportedInspector id={meta.instanceId} />;
    default: {
      const _exhaustive: never = meta.type;
      return _exhaustive;
    }
  }
}

// Creates a typed patch function bound to a single instance id. Using
// `getState()` here means this module writes to the store without
// subscribing to it.
function patcher<P>(id: string): (patch: Partial<P>) => void {
  return (patch) => useEditorStore.getState().updateProps(id, patch as Record<string, unknown>);
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

function LayerInspectorFallback({ label }: { label: string }) {
  return (
    <Section title="Layer">
      <p className="sidebar-help-text">{label} editing is not available yet.</p>
    </Section>
  );
}
