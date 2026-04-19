import { componentTypeLabel } from '../state/component-type-label.ts';
import { useEditorStore, useLayerRows } from '../state/editor.ts';
import './layers.css';

export function LayersSidebar() {
  const rows = useLayerRows();
  const selectedId = useEditorStore((state) => state.selectedId);
  const reversed = [...rows].reverse();

  return (
    <aside className="layers-sidebar">
      <header className="layers-sidebar-header">
        <h2 className="layers-sidebar-title">Layers</h2>
      </header>
      <div className="layers-sidebar-body">
        {rows.length === 0 ? (
          <p className="layers-empty">No instances on the canvas.</p>
        ) : (
          <ul className="layers-list">
            {reversed.map((row) => (
              <li key={row.id} className="layers-list-item">
                <button
                  type="button"
                  className="layers-row"
                  data-selected={selectedId === row.id || undefined}
                  onClick={() => useEditorStore.getState().select(row.id)}
                >
                  <span className="layers-row-primary">{componentTypeLabel(row.type)}</span>
                  <span className="layers-row-secondary">
                    {row.type === 'imported' ? `${row.definitionId} · ${row.id}` : row.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
