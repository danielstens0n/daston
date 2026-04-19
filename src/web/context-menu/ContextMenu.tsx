import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './context-menu.css';
import type { ContextMenuItem } from './types.ts';

const MENU_Z_INDEX = 10_000;
const VIEWPORT_MARGIN = 8;

export type ContextMenuScreenPosition = { x: number; y: number };

type MenuHostValue = {
  openMenu: (args: { clientX: number; clientY: number; items: ContextMenuItem[] }) => void;
  closeMenu: () => void;
};

const ContextMenuHostContext = createContext<MenuHostValue | null>(null);

export function useContextMenuHost(): MenuHostValue {
  const ctx = useContext(ContextMenuHostContext);
  if (!ctx) {
    throw new Error('useContextMenuHost must be used within ContextMenuProvider');
  }
  return ctx;
}

type ProviderState =
  | { open: false }
  | { open: true; clientX: number; clientY: number; items: ContextMenuItem[] };

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderState>({ open: false });

  const openMenu = useCallback((args: { clientX: number; clientY: number; items: ContextMenuItem[] }) => {
    setState({ open: true, clientX: args.clientX, clientY: args.clientY, items: args.items });
  }, []);

  const closeMenu = useCallback(() => {
    setState({ open: false });
  }, []);

  const value = useMemo(() => ({ openMenu, closeMenu }), [openMenu, closeMenu]);

  return (
    <ContextMenuHostContext.Provider value={value}>
      {children}
      <ContextMenu
        open={state.open}
        position={state.open ? { x: state.clientX, y: state.clientY } : null}
        items={state.open ? state.items : []}
        onClose={closeMenu}
      />
    </ContextMenuHostContext.Provider>
  );
}

type ContextMenuProps = {
  open: boolean;
  position: ContextMenuScreenPosition | null;
  items: ContextMenuItem[];
  onClose: () => void;
};

function ContextMenu({ open, position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !position || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    let left = position.x;
    let top = position.y;
    if (left + rect.width > window.innerWidth - VIEWPORT_MARGIN) {
      left = position.x - rect.width;
    }
    if (top + rect.height > window.innerHeight - VIEWPORT_MARGIN) {
      top = position.y - rect.height;
    }
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - rect.width - VIEWPORT_MARGIN));
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - rect.height - VIEWPORT_MARGIN));
    setMenuStyle({
      position: 'fixed',
      left,
      top,
      zIndex: MENU_Z_INDEX,
    });
  }, [open, position]);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(event: PointerEvent) {
      const t = event.target;
      if (!(t instanceof Node)) return;
      if (menuRef.current?.contains(t)) return;
      onClose();
    }
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      onClose();
    }
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, onClose]);

  if (!open || !position || items.length === 0) return null;

  const menu = (
    <div ref={menuRef} className="context-menu" role="menu" style={menuStyle}>
      {items.map((item, index) => {
        if (item.kind === 'separator') {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: separators have no stable id
            <div key={index} className="context-menu-row context-menu-separator-wrap" role="presentation">
              <hr className="context-menu-separator" />
            </div>
          );
        }
        const { label, shortcut, disabled, onSelect } = item;
        const rowKey = shortcut ? `${label}\u0000${shortcut}` : label;
        return (
          <div key={rowKey} className="context-menu-row" role="presentation">
            <button
              type="button"
              className="context-menu-item"
              role="menuitem"
              disabled={disabled}
              onPointerDown={(e) => {
                if (disabled) return;
                e.preventDefault();
              }}
              onClick={() => {
                if (disabled) return;
                onSelect();
                onClose();
              }}
            >
              <span className="context-menu-item-label">{label}</span>
              {shortcut ? <span className="context-menu-item-shortcut">{shortcut}</span> : null}
            </button>
          </div>
        );
      })}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(menu, document.body) : null;
}
