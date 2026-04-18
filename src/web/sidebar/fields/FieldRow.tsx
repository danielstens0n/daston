import type { ReactNode } from 'react';

type Props = {
  label: string;
  children: ReactNode;
};

// Label on the left, control on the right. Used by every section so the
// sidebar keeps a consistent alignment. The label is a plain `<span>` rather
// than `<label>` because each field row may wrap a composite control (swatch
// + hex input, number + unit) with no single associated form element.
export function FieldRow({ label, children }: Props) {
  return (
    <div className="sidebar-field-row">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}
