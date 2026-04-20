import type { ReactNode } from 'react';
import { Button } from '../previews/Button.tsx';
import { Card } from '../previews/Card.tsx';
import { ImportedPreview } from '../previews/ImportedPreview.tsx';
import { Landing } from '../previews/Landing.tsx';
import { Table } from '../previews/Table.tsx';
import { Section } from '../sidebar/fields/Section.tsx';
import { ButtonInspector } from '../sidebar/inspectors/ButtonInspector.tsx';
import { CardInspector } from '../sidebar/inspectors/CardInspector.tsx';
import { CardLayerInspector } from '../sidebar/inspectors/CardLayerInspector.tsx';
import { ImportedInspector } from '../sidebar/inspectors/ImportedInspector.tsx';
import { LandingInspector } from '../sidebar/inspectors/LandingInspector.tsx';
import { TableInspector } from '../sidebar/inspectors/TableInspector.tsx';
import { isCardLayerId } from './component-registry-data.ts';
import type { ButtonProps, CardProps, ComponentInstance, LandingProps, TableProps } from './types.ts';

export function renderPreviewBody(instance: ComponentInstance): ReactNode {
  switch (instance.type) {
    case 'card':
      return <Card id={instance.id} />;
    case 'button':
      return <Button id={instance.id} />;
    case 'table':
      return <Table id={instance.id} />;
    case 'landing':
      return <Landing id={instance.id} />;
    case 'imported':
      return <ImportedPreview id={instance.id} />;
    default: {
      const _exhaustive: never = instance;
      return _exhaustive;
    }
  }
}

type StockInstanceType = Exclude<ComponentInstance['type'], 'imported'>;

export function renderStockInstanceInspector(
  type: StockInstanceType,
  instanceId: string,
  onPatch: (patch: Record<string, unknown>) => void,
): ReactNode {
  switch (type) {
    case 'card':
      return <CardInspector id={instanceId} onPatch={onPatch as (patch: Partial<CardProps>) => void} />;
    case 'button':
      return <ButtonInspector id={instanceId} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />;
    case 'table':
      return <TableInspector id={instanceId} onPatch={onPatch as (patch: Partial<TableProps>) => void} />;
    case 'landing':
      return <LandingInspector id={instanceId} onPatch={onPatch as (patch: Partial<LandingProps>) => void} />;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function renderImportedInstanceInspector(instanceId: string): ReactNode {
  return <ImportedInspector id={instanceId} />;
}

export function renderLayerInspector(
  meta: {
    type: ComponentInstance['type'];
    instanceId: string;
    layerId: string;
  },
  selectedLabel: string,
  onPatch: (patch: Record<string, unknown>) => void,
): ReactNode {
  if (meta.type === 'card' && isCardLayerId(meta.layerId)) {
    return (
      <CardLayerInspector
        id={meta.instanceId}
        layerId={meta.layerId}
        onPatch={onPatch as (patch: Partial<CardProps>) => void}
      />
    );
  }
  return (
    <Section title="Layer">
      <p className="sidebar-help-text">{selectedLabel} editing is not available yet.</p>
    </Section>
  );
}
