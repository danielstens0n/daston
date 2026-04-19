import type { CSSProperties } from 'react';
import { useEditorStore, useTableProps } from '../state/editor.ts';
import { EditableText } from './EditableText.tsx';
import './table.css';

type Props = {
  id: string;
};

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
                {p.columns.map((column, columnIndex) => (
                  <th key={`${id}-column-${column}`}>
                    <EditableText
                      value={column}
                      onChange={(nextColumn) =>
                        useEditorStore.getState().updateProps(id, {
                          columns: p.columns.map((entry, index) =>
                            index === columnIndex ? nextColumn : entry,
                          ),
                        })
                      }
                      className="preview-table-text"
                      inputClassName="preview-table-text preview-inline-text-input"
                    />
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {p.rows.map((row, rowIndex) => {
              const rowBg = p.zebra ? (rowIndex % 2 === 1 ? p.rowFillAlt : p.rowFill) : p.rowFill;
              return (
                <tr
                  key={`${id}-row-${row.join('|')}`}
                  className="preview-table-row"
                  style={{ background: rowBg }}
                >
                  {p.columns.map((column, columnIndex) => (
                    <td key={`${id}-cell-${column}-${row[columnIndex] ?? ''}`}>
                      <EditableText
                        value={row[columnIndex] ?? ''}
                        onChange={(nextCell) =>
                          useEditorStore.getState().updateProps(id, {
                            rows: p.rows.map((entry, entryIndex) =>
                              entryIndex === rowIndex
                                ? p.columns.map((__, cellIndex) =>
                                    cellIndex === columnIndex ? nextCell : (entry[cellIndex] ?? ''),
                                  )
                                : entry,
                            ),
                          })
                        }
                        className="preview-table-text"
                        inputClassName="preview-table-text preview-inline-text-input"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
