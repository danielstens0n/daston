import type { ReactNode } from 'react';
import { Button } from '../../previews/Button.tsx';
import { Card } from '../../previews/Card.tsx';
import { Ellipse } from '../../previews/Ellipse.tsx';
import { ImportedPreview } from '../../previews/ImportedPreview.tsx';
import { Landing } from '../../previews/Landing.tsx';
import { Rectangle } from '../../previews/Rectangle.tsx';
import { Table } from '../../previews/Table.tsx';
import { Text } from '../../previews/Text.tsx';
import { Triangle } from '../../previews/Triangle.tsx';
import { Section } from '../../sidebar/fields/Section.tsx';
import { ImportedLayerInspector } from '../../sidebar/inspectors/ImportedLayerInspector.tsx';
import { LandingLayerInspector } from '../../sidebar/inspectors/LandingLayerInspector.tsx';
import { TextPrimitiveFields } from '../../sidebar/inspectors/StockInstanceInspector.tsx';
import { TableLayerInspector } from '../../sidebar/inspectors/TableLayerInspector.tsx';
import type { ComponentInstance } from '../types.ts';
import { componentTypeLabel } from './data.ts';

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
    case 'rectangle':
      return <Rectangle id={instance.id} />;
    case 'ellipse':
      return <Ellipse id={instance.id} />;
    case 'triangle':
      return <Triangle id={instance.id} />;
    case 'text':
      return <Text id={instance.id} />;
    case 'imported':
      return <ImportedPreview id={instance.id} />;
    default: {
      const _exhaustive: never = instance;
      return _exhaustive;
    }
  }
}

export function renderImportedInstanceInspector(instanceId: string): ReactNode {
  return <ImportedLayerInspector id={instanceId} />;
}

export function renderLayerInspector(meta: {
  type: ComponentInstance['type'];
  instanceId: string;
  layerId: string;
}): ReactNode {
  if (meta.type === 'table') {
    return <TableLayerInspector id={meta.instanceId} layerId={meta.layerId} />;
  }
  if (meta.type === 'landing') {
    return <LandingLayerInspector id={meta.instanceId} layerId={meta.layerId} />;
  }
  if (meta.type === 'text' && meta.layerId === 'text') {
    return <TextPrimitiveFields id={meta.instanceId} />;
  }
  return (
    <Section title="Layer">
      <p className="sidebar-help-text">{componentTypeLabel(meta.type)} layer editing is not available yet.</p>
    </Section>
  );
}
