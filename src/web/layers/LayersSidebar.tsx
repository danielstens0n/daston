import {
  createContext,
  type DragEvent as ReactDragEvent,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useContextMenuHost } from '../context-menu/ContextMenu.tsx';
import { buildLayerMenuItems } from '../context-menu/items.ts';
import { useEditorStore, useIsLayerSelected, useLayerTree } from '../state/editor.ts';
import { collectSubtreeIds } from '../state/hierarchy.ts';
import type { LayerNode } from '../state/layers.ts';
import type { ComponentInstance } from '../state/types.ts';
import { SidebarToggleIcon } from '../toolbar/icons.tsx';
import { computeReorderTarget, type DropZone } from './layer-reorder.ts';
import './layers.css';

type DropIndicator = { targetId: string; zone: DropZone };

type LayerRowContextValue = {
  collapsedRows: Set<string>;
  toggleRow: (id: string) => void;
  openMenu: ReturnType<typeof useContextMenuHost>['openMenu'];
  draggingId: string | null;
  dropIndicator: DropIndicator | null;
  onRowDragStart: (id: string) => void;
  onRowDragEnd: () => void;
  onRowDragOver: (event: ReactDragEvent<HTMLElement>, targetId: string) => void;
  onRowDragLeave: (targetId: string) => void;
  onRowDrop: (event: ReactDragEvent<HTMLElement>, targetId: string, isRoot: boolean) => void;
};

const LayerRowContext = createContext<LayerRowContextValue | null>(null);

function useLayerRowContext(): LayerRowContextValue {
  const ctx = useContext(LayerRowContext);
  if (!ctx) {
    throw new Error('LayerTreeRow must be used within LayerRowContext');
  }
  return ctx;
}

// Three-way split (Figma-style): top/bottom 25% reorder above/below; middle 50%
// reparents under the row. When `allowOnto` is false the middle collapses to
// edge-only reorder (e.g. sibling rows where "onto" would be a bad default).
// `buildOntoTargets` lists valid reparent targets for `dragged`, built once per
// drag: exclude `dragged`'s subtree, its current parent, and siblings under a
// non-null parent (reorder z-order instead). Root siblings stay valid so roots
// can nest under each other.
function buildOntoTargets(instances: readonly ComponentInstance[], draggedId: string): Set<string> {
  const dragged = instances.find((i) => i.id === draggedId);
  if (!dragged) return new Set();
  const draggedParentId = dragged.parentId;
  const excluded = collectSubtreeIds(instances, draggedId);
  const ids = new Set<string>();
  for (const inst of instances) {
    if (excluded.has(inst.id)) continue;
    if (inst.id === draggedParentId) continue;
    if (draggedParentId !== null && inst.parentId === draggedParentId) continue;
    ids.add(inst.id);
  }
  return ids;
}

function zoneFromPointer(event: ReactDragEvent<HTMLElement>, allowOnto: boolean): DropZone {
  const rect = event.currentTarget.getBoundingClientRect();
  const relative = (event.clientY - rect.top) / rect.height;
  if (!allowOnto) return relative < 0.5 ? 'above' : 'below';
  if (relative < 0.25) return 'above';
  if (relative > 0.75) return 'below';
  return 'onto';
}

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
  const { openMenu } = useContextMenuHost();
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(() => new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  // Cached once per drag session so the O(N) subtree walk and parent-relation
  // check don't re-run on every `dragover` pixel. Instances don't mutate
  // mid-drag (HTML5 DnD is modal), so both sets stay valid until drag end.
  const excludedSubtreeRef = useRef<Set<string> | null>(null);
  const ontoTargetsRef = useRef<Set<string> | null>(null);
  const reversedRows = useMemo(() => [...rows].reverse(), [rows]);

  const toggleRow = useCallback((id: string) => {
    setCollapsedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onRowDragStart = useCallback((id: string) => {
    const { instances } = useEditorStore.getState();
    excludedSubtreeRef.current = collectSubtreeIds(instances, id);
    ontoTargetsRef.current = buildOntoTargets(instances, id);
    setDraggingId(id);
  }, []);

  const onRowDragEnd = useCallback(() => {
    excludedSubtreeRef.current = null;
    ontoTargetsRef.current = null;
    setDraggingId(null);
    setDropIndicator(null);
  }, []);

  const onRowDragOver = useCallback(
    (event: ReactDragEvent<HTMLElement>, targetId: string) => {
      if (!draggingId || draggingId === targetId) return;
      // Reject drops onto the dragged row's own subtree to keep the cursor
      // accurate; the mutation also rejects this.
      if (excludedSubtreeRef.current?.has(targetId)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const allowOnto = ontoTargetsRef.current?.has(targetId) ?? false;
      const zone = zoneFromPointer(event, allowOnto);
      setDropIndicator((current) =>
        current && current.targetId === targetId && current.zone === zone ? current : { targetId, zone },
      );
    },
    [draggingId],
  );

  const onRowDragLeave = useCallback((targetId: string) => {
    setDropIndicator((current) => (current && current.targetId === targetId ? null : current));
  }, []);

  const onRowDrop = useCallback(
    (event: ReactDragEvent<HTMLElement>, targetId: string, isRoot: boolean) => {
      event.preventDefault();
      event.stopPropagation();
      const dragged = draggingId ?? event.dataTransfer.getData('text/plain');
      const allowOnto = ontoTargetsRef.current?.has(targetId) ?? false;
      excludedSubtreeRef.current = null;
      ontoTargetsRef.current = null;
      setDraggingId(null);
      setDropIndicator(null);
      if (!dragged || dragged === targetId) return;
      const zone = zoneFromPointer(event, allowOnto);
      const target = computeReorderTarget(
        useEditorStore.getState().instances,
        dragged,
        targetId,
        zone,
        isRoot,
      );
      if (!target) return;
      useEditorStore.getState().reorderInstance(dragged, target);
    },
    [draggingId],
  );

  const rowContextValue: LayerRowContextValue = useMemo(
    () => ({
      collapsedRows,
      toggleRow,
      openMenu,
      draggingId,
      dropIndicator,
      onRowDragStart,
      onRowDragEnd,
      onRowDragOver,
      onRowDragLeave,
      onRowDrop,
    }),
    [
      collapsedRows,
      draggingId,
      dropIndicator,
      onRowDragEnd,
      onRowDragLeave,
      onRowDragOver,
      onRowDragStart,
      onRowDrop,
      openMenu,
      toggleRow,
    ],
  );

  return (
    <LayerRowContext.Provider value={rowContextValue}>
      <div className="layers-sidebar-body">
        {rows.length === 0 ? (
          <p className="layers-empty">No instances on the canvas.</p>
        ) : (
          <ul className="layers-list" aria-label="Layers tree">
            {reversedRows.map((row) => (
              <LayerTreeRow key={row.id} node={row} depth={0} isRoot />
            ))}
          </ul>
        )}
      </div>
    </LayerRowContext.Provider>
  );
}

function LayerTreeRow({ node, depth, isRoot }: { node: LayerNode; depth: number; isRoot: boolean }) {
  const {
    collapsedRows,
    toggleRow,
    openMenu,
    draggingId,
    dropIndicator,
    onRowDragStart,
    onRowDragEnd,
    onRowDragOver,
    onRowDragLeave,
    onRowDrop,
  } = useLayerRowContext();
  const isSelected = useIsLayerSelected(node.selection);
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedRows.has(node.id);
  const isInstanceRow = node.selection.kind === 'instance';
  const isDragging = isInstanceRow && draggingId === node.instanceId;
  const dropZone = isInstanceRow && dropIndicator?.targetId === node.instanceId ? dropIndicator.zone : null;

  function onSelect() {
    if (node.selection.kind === 'instance') {
      useEditorStore.getState().select(node.instanceId);
      return;
    }
    useEditorStore.getState().selectLayer(node.selection);
  }

  const dragHandlers = isInstanceRow
    ? {
        draggable: true,
        onDragStart: (event: ReactDragEvent<HTMLElement>) => {
          event.stopPropagation();
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', node.instanceId);
          onRowDragStart(node.instanceId);
        },
        onDragEnd: onRowDragEnd,
        onDragOver: (event: ReactDragEvent<HTMLElement>) => onRowDragOver(event, node.instanceId),
        onDragLeave: () => onRowDragLeave(node.instanceId),
        onDrop: (event: ReactDragEvent<HTMLElement>) => onRowDrop(event, node.instanceId, isRoot),
      }
    : null;

  return (
    <li className="layers-list-item">
      <div
        className="layers-row-shell"
        data-drop-zone={dropZone ?? undefined}
        data-dragging={isDragging || undefined}
        style={{ paddingInlineStart: `${depth * 16}px` }}
        {...(dragHandlers ?? {})}
      >
        {hasChildren ? (
          <button
            type="button"
            className="layers-row-toggle"
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${node.label}`}
            aria-expanded={!isCollapsed}
            onClick={() => toggleRow(node.id)}
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
            openMenu({
              clientX: event.clientX,
              clientY: event.clientY,
              items: buildLayerMenuItems(node.selection),
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
            <LayerTreeRow key={child.id} node={child} depth={depth + 1} isRoot={false} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
