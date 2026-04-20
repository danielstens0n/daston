import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
  enabled?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
};

// Labelled group of field rows. Optional `enabled` + `onAdd`/`onRemove` add
// Figma-style add/remove affordances on the section header.
export function Section({ title, children, enabled, onAdd, onRemove }: Props) {
  const toggleable = enabled !== undefined;
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-head">
        <h3 className="sidebar-section-title">{title}</h3>
        {toggleable ? (
          enabled ? (
            <button
              type="button"
              className="sidebar-section-toggle sidebar-section-toggle-remove"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
            >
              −
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-section-toggle sidebar-section-toggle-add"
              onClick={onAdd}
              aria-label={`Add ${title}`}
            >
              +
            </button>
          )
        ) : null}
      </div>
      {!toggleable || enabled ? children : null}
    </section>
  );
}
