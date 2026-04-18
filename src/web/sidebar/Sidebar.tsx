import { useEditorStore, useSelectedInstanceMeta } from '../state/editor.ts';
import type { CardProps, ComponentInstance } from '../state/types.ts';
import { CardInspector } from './inspectors/CardInspector.tsx';
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
  }
}

function titleFor(type: ComponentInstance['type']): string {
  switch (type) {
    case 'card':
      return 'Card';
  }
}

// Creates a typed patch function bound to a single instance id. Using
// `getState()` here means this module writes to the store without
// subscribing to it.
function patcher<P>(id: string): (patch: Partial<P>) => void {
  return (patch) => useEditorStore.getState().updateProps(id, patch as Record<string, unknown>);
}
