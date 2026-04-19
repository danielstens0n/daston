import { useState } from 'react';
import { useContextMenuHost } from '../context-menu/ContextMenu.tsx';
import { buildInstanceMenuItems } from '../context-menu/items.ts';
import { componentTypeLabel } from '../state/component-type-label.ts';
import { useEditorStore, useLayerRows } from '../state/editor.ts';
import { SidebarToggleIcon } from '../toolbar/icons.tsx';
import './layers.css';

export function LayersSidebar() {
  const rows = useLayerRows();
  const selectedId = useEditorStore((state) => state.selectedId);
  const { openMenu } = useContextMenuHost();
  const [collapsed, setCollapsed] = useState(false);
  const reversed = [...rows].reverse();
  const toggleLabel = collapsed ? 'Expand layers sidebar' : 'Collapse layers sidebar';

  return (
    <aside className="layers-sidebar" data-collapsed={collapsed || undefined}>
      <header className="layers-sidebar-header">
        <h2 className="layers-sidebar-title">Layers</h2>
        <button
          type="button"
          className="layers-sidebar-toggle"
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          <SidebarToggleIcon collapsed={collapsed} />
        </button>
      </header>
      {collapsed ? null : (
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
                    onContextMenu={(event) => {
                      event.preventDefault();
                      useEditorStore.getState().select(row.id);
                      openMenu({
                        clientX: event.clientX,
                        clientY: event.clientY,
                        items: buildInstanceMenuItems(row.id),
                      });
                    }}
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
      )}
    </aside>
  );
}
