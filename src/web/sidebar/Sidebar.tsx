import { useEditorStore, useSelectedInstanceMeta } from '../state/editor.ts';
import type { ButtonProps, CardProps, ComponentInstance, LandingProps, TableProps } from '../state/types.ts';
import { ButtonInspector } from './inspectors/ButtonInspector.tsx';
import { CardInspector } from './inspectors/CardInspector.tsx';
import { LandingInspector } from './inspectors/LandingInspector.tsx';
import { TableInspector } from './inspectors/TableInspector.tsx';
import './fields/fields.css';
import './sidebar.css';

export function Sidebar() {
  const meta = useSelectedInstanceMeta();

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h2 className="sidebar-header-title">{meta ? titleFor(meta.type) : 'Inspector'}</h2>
        <p className="sidebar-header-subtitle">
          {meta ? `${meta.type} · ${meta.id}` : 'Select a component to edit'}
        </p>
      </header>
      {meta ? renderInspector(meta) : <div className="sidebar-empty">Nothing selected.</div>}
    </aside>
  );
}

// Dispatch by type. Each inspector pulls its own props by id rather than
// receiving them drilled through here — keeps Sidebar decoupled from the
// prop shape of each component type. When ComponentInstance becomes a union
// of 2+ types, add a `default` branch with `const _: never = meta` so
// missing cases are a compile error.
function renderInspector(meta: { id: string; type: ComponentInstance['type'] }) {
  switch (meta.type) {
    case 'card':
      return <CardInspector id={meta.id} onPatch={patcher<CardProps>(meta.id)} />;
    case 'button':
      return <ButtonInspector id={meta.id} onPatch={patcher<ButtonProps>(meta.id)} />;
    case 'table':
      return <TableInspector id={meta.id} onPatch={patcher<TableProps>(meta.id)} />;
    case 'landing':
      return <LandingInspector id={meta.id} onPatch={patcher<LandingProps>(meta.id)} />;
    case 'imported':
      return <div className="sidebar-empty">Imported components are not editable here.</div>;
  }
}

function titleFor(type: ComponentInstance['type']): string {
  switch (type) {
    case 'card':
      return 'Card';
    case 'button':
      return 'Button';
    case 'table':
      return 'Table';
    case 'landing':
      return 'Landing page';
    case 'imported':
      return 'Imported';
  }
}

// Creates a typed patch function bound to a single instance id. Using
// `getState()` here means this module writes to the store without
// subscribing to it.
function patcher<P>(id: string): (patch: Partial<P>) => void {
  return (patch) => useEditorStore.getState().updateProps(id, patch as Record<string, unknown>);
}
