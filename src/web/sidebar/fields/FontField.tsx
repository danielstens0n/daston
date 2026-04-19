import type { ChangeEvent, KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FONTS, getFontLabel, getFontStack } from '../../lib/fonts.ts';

type Props = {
  value: string;
  onChange: (id: string) => void;
  /** Accessible name for the trigger (e.g. matches the field row label). */
  ariaLabel: string;
};

export function FontField({ value, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useRef(`sidebar-font-list-${Math.random().toString(36).slice(2, 10)}`).current;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...FONTS];
    return FONTS.filter((f) => f.label.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const node = wrapRef.current;
      if (!node || !(event.target instanceof Node) || node.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const max = Math.max(0, filtered.length - 1);
    setHighlightedIndex((i) => Math.min(i, max));
  }, [filtered.length, open]);

  useEffect(() => {
    if (!open) return;
    const root = wrapRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-font-option-index="${highlightedIndex}"]`);
    if (el instanceof HTMLElement && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const displayStack = getFontStack(value);
  const displayLabel = getFontLabel(value);

  function close() {
    setOpen(false);
    setQuery('');
  }

  function commitHighlight() {
    const entry = filtered[highlightedIndex];
    if (entry) onChange(entry.id);
    close();
  }

  function toggleOpen() {
    setOpen((wasOpen) => {
      if (wasOpen) {
        setQuery('');
        return false;
      }
      setQuery('');
      setHighlightedIndex(0);
      return true;
    });
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commitHighlight();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    }
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
    }
    if ((event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      setOpen(true);
      setQuery('');
      setHighlightedIndex(0);
    }
  }

  return (
    <div className="sidebar-font-field" ref={wrapRef}>
      <button
        type="button"
        className="sidebar-font-field-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        style={{ fontFamily: displayStack }}
        onClick={toggleOpen}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="sidebar-font-field-trigger-label">{displayLabel}</span>
        <span className="sidebar-font-field-trigger-chevron" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <div className="sidebar-font-field-popover" role="presentation">
          <input
            ref={searchRef}
            className="sidebar-font-field-search"
            type="search"
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setQuery(event.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Search fonts"
            aria-label="Search fonts"
          />
          <div id={listId} className="sidebar-font-field-list" role="listbox" aria-label="Fonts">
            {filtered.length === 0 ? (
              <div className="sidebar-font-field-empty">No matching fonts</div>
            ) : (
              filtered.map((font, index) => (
                <button
                  key={font.id}
                  type="button"
                  role="option"
                  aria-selected={font.id === value}
                  data-font-option-index={index}
                  className={`sidebar-font-field-option${index === highlightedIndex ? ' sidebar-font-field-option-active' : ''}`}
                  style={{ fontFamily: font.stack }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => {
                    onChange(font.id);
                    close();
                  }}
                >
                  {font.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
