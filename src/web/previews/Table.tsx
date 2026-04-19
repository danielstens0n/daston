import type { CSSProperties } from 'react';
import { useTableProps } from '../state/editor.ts';
import './table.css';

type Props = {
  id: string;
};

const SAMPLE_ROWS = [
  { a: 'Ada', b: 'Engineer', c: 'Active' },
  { a: 'Bob', b: 'Designer', c: 'Away' },
  { a: 'Cara', b: 'PM', c: 'Active' },
  { a: 'Dan', b: 'QA', c: 'Active' },
];

export function Table({ id }: Props) {
  const p = useTableProps(id);
  if (!p) return null;

  const style: CSSProperties & Record<string, string> = {
    '--table-border-color': p.borderColor,
    '--table-border-width': `${p.borderWidth}px`,
    '--table-border-radius': `${p.borderRadius}px`,
    '--table-cell-padding': `${p.cellPadding}px`,
    '--table-header-fill': p.headerFill,
    '--table-row-fill': p.rowFill,
    '--table-row-fill-alt': p.rowFillAlt,
    '--table-header-text': p.headerTextColor,
    '--table-body-text': p.bodyTextColor,
  };

  return (
    <div className="preview-table-root" style={style}>
      <div className="preview-table-scroll">
        <table className="preview-table-el">
          {p.showHeader ? (
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
          ) : null}
          <tbody>
            {SAMPLE_ROWS.map((row, i) => {
              const rowBg = p.zebra ? (i % 2 === 1 ? p.rowFillAlt : p.rowFill) : p.rowFill;
              return (
                <tr key={row.a} className="preview-table-row" style={{ background: rowBg }}>
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                  <td>{row.c}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
