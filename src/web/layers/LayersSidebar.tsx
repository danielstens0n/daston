import { useMemo, useState } from 'react';
import { useContextMenuHost } from '../context-menu/ContextMenu.tsx';
import { buildInstanceMenuItems } from '../context-menu/items.ts';
import { useEditorStore, useLayerTree, useSelectedTarget } from '../state/editor.ts';
import { type LayerNode, type SelectedTarget, selectedTargetsEqual } from '../state/layers.ts';
import { SidebarToggleIcon } from '../toolbar/icons.tsx';
import './layers.css';

export function LayersSidebar() {
  const [collapsed, setCollapsed] = useState(false);
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
          <SidebarToggleIcon collapsed={collapsed} title={toggleLabel} />
        </button>
      </header>
      {collapsed ? null : <LayersSidebarBody />}
    </aside>
  );
}

function LayersSidebarBody() {
  const rows = useLayerTree();
  const selectedTarget = useSelectedTarget();
  const { openMenu } = useContextMenuHost();
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(() => new Set());
  const reversedRows = useMemo(() => [...rows].reverse(), [rows]);

  function toggleRow(id: string) {
    setCollapsedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="layers-sidebar-body">
      {rows.length === 0 ? (
        <p className="layers-empty">No instances on the canvas.</p>
      ) : (
        <ul className="layers-list" aria-label="Layers tree">
          {reversedRows.map((row) => (
            <LayerTreeRow
              key={row.id}
              node={row}
              depth={0}
              collapsedRows={collapsedRows}
              selectedTarget={selectedTarget}
              onToggle={toggleRow}
              onOpenMenu={openMenu}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LayerTreeRow({
  node,
  depth,
  collapsedRows,
  selectedTarget,
  onToggle,
  onOpenMenu,
}: {
  node: LayerNode;
  depth: number;
  collapsedRows: Set<string>;
  selectedTarget: SelectedTarget | null;
  onToggle: (id: string) => void;
  onOpenMenu: ReturnType<typeof useContextMenuHost>['openMenu'];
}) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedRows.has(node.id);
  const isSelected = selectedTargetsEqual(selectedTarget, node.selection);

  function onSelect() {
    if (node.selection.kind === 'instance') {
      useEditorStore.getState().select(node.instanceId);
      return;
    }
    useEditorStore.getState().selectLayer(node.selection);
  }

  return (
    <li className="layers-list-item">
      <div className="layers-row-shell" style={{ paddingInlineStart: `${depth * 16}px` }}>
        {hasChildren ? (
          <button
            type="button"
            className="layers-row-toggle"
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${node.label}`}
            aria-expanded={!isCollapsed}
            onClick={() => onToggle(node.id)}
          >
            {isCollapsed ? '>' : 'v'}
          </button>
        ) : (
          <span className="layers-row-toggle-spacer" aria-hidden />
        )}
        <button
          type="button"
          className="layers-row"
          data-selected={isSelected || undefined}
          data-layer-kind={node.kind}
          onClick={onSelect}
          onContextMenu={(event) => {
            event.preventDefault();
            onSelect();
            onOpenMenu({
              clientX: event.clientX,
              clientY: event.clientY,
              items: buildInstanceMenuItems(node.instanceId),
            });
          }}
        >
          <span className="layers-row-primary">{node.label}</span>
          <span className="layers-row-secondary">{node.secondaryLabel ?? node.kind}</span>
        </button>
      </div>
      {hasChildren && !isCollapsed ? (
        <ul className="layers-sublist">
          {node.children.map((child) => (
            <LayerTreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsedRows={collapsedRows}
              selectedTarget={selectedTarget}
              onToggle={onToggle}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
