import type { ReactNode } from 'react';
import { Button } from '../../previews/Button.tsx';
import { Card } from '../../previews/Card.tsx';
import { ImportedPreview } from '../../previews/ImportedPreview.tsx';
import { Landing } from '../../previews/Landing.tsx';
import { Table } from '../../previews/Table.tsx';
import { Section } from '../../sidebar/fields/Section.tsx';
import { ButtonLayerInspector } from '../../sidebar/inspectors/ButtonLayerInspector.tsx';
import { CardLayerInspector } from '../../sidebar/inspectors/CardLayerInspector.tsx';
import { ImportedLayerInspector } from '../../sidebar/inspectors/ImportedLayerInspector.tsx';
import { LandingLayerInspector } from '../../sidebar/inspectors/LandingLayerInspector.tsx';
import { StockInstanceInspector } from '../../sidebar/inspectors/StockInstanceInspector.tsx';
import { TableLayerInspector } from '../../sidebar/inspectors/TableLayerInspector.tsx';
import type { ComponentInstance } from '../types.ts';
import { componentTypeLabel, isCardLayerId } from './data.ts';

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

export function renderStockInstanceInspector(
  type: Exclude<ComponentInstance['type'], 'imported'>,
  instanceId: string,
): ReactNode {
  return <StockInstanceInspector type={type} id={instanceId} />;
}

export function renderImportedInstanceInspector(instanceId: string): ReactNode {
  return <ImportedLayerInspector id={instanceId} />;
}

export function renderLayerInspector(meta: {
  type: ComponentInstance['type'];
  instanceId: string;
  layerId: string;
}): ReactNode {
  if (meta.type === 'card' && isCardLayerId(meta.layerId)) {
    return <CardLayerInspector id={meta.instanceId} layerId={meta.layerId} />;
  }
  if (meta.type === 'button') {
    return <ButtonLayerInspector id={meta.instanceId} layerId={meta.layerId} />;
  }
  if (meta.type === 'table') {
    return <TableLayerInspector id={meta.instanceId} layerId={meta.layerId} />;
  }
  if (meta.type === 'landing') {
    return <LandingLayerInspector id={meta.instanceId} layerId={meta.layerId} />;
  }
  return (
    <Section title="Layer">
      <p className="sidebar-help-text">{componentTypeLabel(meta.type)} layer editing is not available yet.</p>
    </Section>
  );
}
