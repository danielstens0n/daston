import type { CSSProperties } from 'react';
import { previewTypographyVars } from '../lib/previewTypographyVars.ts';
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
    ...previewTypographyVars(
      {
        font: '--table-header-font',
        size: '--table-header-font-size',
        weight: '--table-header-font-weight',
        style: '--table-header-font-style',
        decorationLine: '--table-header-decoration-line',
      },
      p.headerFont,
      p.headerFontSize,
      p.headerFontWeight,
      p.headerItalic,
      p.headerDecoration,
    ),
    ...previewTypographyVars(
      {
        font: '--table-body-font',
        size: '--table-body-font-size',
        weight: '--table-body-font-weight',
        style: '--table-body-font-style',
        decorationLine: '--table-body-decoration-line',
      },
      p.bodyFont,
      p.bodyFontSize,
      p.bodyFontWeight,
      p.bodyItalic,
      p.bodyDecoration,
    ),
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
                      instanceId={id}
                      value={column}
                      onChange={(nextColumn) =>
                        useEditorStore.getState().updateProps(id, {
                          columns: p.columns.map((entry, index) =>
                            index === columnIndex ? nextColumn : entry,
                          ),
                        })
                      }
                      className="preview-table-text"
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
                        instanceId={id}
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
