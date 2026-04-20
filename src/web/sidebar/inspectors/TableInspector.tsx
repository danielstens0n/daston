import { useTableProps } from '../../state/editor.ts';
import type { TableProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';
import { TypographyStyleRows } from '../fields/TypographyStyleRows.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<TableProps>) => void;
};

export function TableInspector({ id, onPatch }: Props) {
  const table = useTableProps(id);
  if (!table) return null;

  const canRemoveColumn = table.columns.length > 1;

  const patchColumn = (columnIndex: number, value: string) => {
    onPatch({
      columns: table.columns.map((entry, index) => (index === columnIndex ? value : entry)),
    });
  };

  const patchCell = (rowIndex: number, columnIndex: number, value: string) => {
    onPatch({
      rows: table.rows.map((row, index) =>
        index === rowIndex
          ? table.columns.map((_, cellIndex) => (cellIndex === columnIndex ? value : (row[cellIndex] ?? '')))
          : row,
      ),
    });
  };

  const addColumn = () => {
    onPatch({
      columns: [...table.columns, `Column ${table.columns.length + 1}`],
      rows: table.rows.map((row) => [...row, '']),
    });
  };

  const removeColumn = (columnIndex: number) => {
    if (!canRemoveColumn) return;
    onPatch({
      columns: table.columns.filter((_, index) => index !== columnIndex),
      rows: table.rows.map((row) => row.filter((_, index) => index !== columnIndex)),
    });
  };

  const addRow = () => {
    onPatch({
      rows: [...table.rows, table.columns.map(() => '')],
    });
  };

  const removeRow = (rowIndex: number) => {
    onPatch({
      rows: table.rows.filter((_, index) => index !== rowIndex),
    });
  };

  return (
    <>
      <Section title="Table">
        <FieldRow label="Header row">
          <ToggleField value={table.showHeader} onChange={(value) => onPatch({ showHeader: value })} />
        </FieldRow>
        <FieldRow label="Zebra">
          <ToggleField value={table.zebra} onChange={(value) => onPatch({ zebra: value })} />
        </FieldRow>
        <FieldRow label="Cell pad">
          <NumberField
            value={table.cellPadding}
            onChange={(value) => onPatch({ cellPadding: value })}
            min={0}
            max={32}
            unit="px"
          />
        </FieldRow>
      </Section>
      <Section title="Fills">
        <FieldRow label="Header">
          <ColorField value={table.headerFill} onChange={(value) => onPatch({ headerFill: value })} />
        </FieldRow>
        <FieldRow label="Row">
          <ColorField value={table.rowFill} onChange={(value) => onPatch({ rowFill: value })} />
        </FieldRow>
        <FieldRow label="Alt row">
          <ColorField value={table.rowFillAlt} onChange={(value) => onPatch({ rowFillAlt: value })} />
        </FieldRow>
      </Section>
      <Section title="Border">
        <FieldRow label="Color">
          <ColorField value={table.borderColor} onChange={(value) => onPatch({ borderColor: value })} />
        </FieldRow>
        <FieldRow label="Width">
          <NumberField
            value={table.borderWidth}
            onChange={(value) => onPatch({ borderWidth: value })}
            min={0}
            max={12}
            unit="px"
          />
        </FieldRow>
        <FieldRow label="Radius">
          <NumberField
            value={table.borderRadius}
            onChange={(value) => onPatch({ borderRadius: value })}
            min={0}
            max={32}
            unit="px"
          />
        </FieldRow>
      </Section>
      <Section title="Text">
        <FieldRow label="Header">
          <ColorField
            value={table.headerTextColor}
            onChange={(value) => onPatch({ headerTextColor: value })}
          />
        </FieldRow>
        <FieldRow label="Body">
          <ColorField value={table.bodyTextColor} onChange={(value) => onPatch({ bodyTextColor: value })} />
        </FieldRow>
      </Section>
      <Section title="Typography">
        <TypographyStyleRows
          font={table.headerFont}
          onFontChange={(value) => onPatch({ headerFont: value })}
          fontSize={table.headerFontSize}
          onFontSizeChange={(value) => onPatch({ headerFontSize: value })}
          fontWeight={table.headerFontWeight}
          onFontWeightChange={(value) => onPatch({ headerFontWeight: value })}
          italic={table.headerItalic}
          onItalicChange={(value) => onPatch({ headerItalic: value })}
          decoration={table.headerDecoration}
          onDecorationChange={(value) => onPatch({ headerDecoration: value })}
          fontRowLabel="Header"
          fontAriaLabel="Table header font"
          weightAriaLabel="Table header weight"
        />
        <TypographyStyleRows
          font={table.bodyFont}
          onFontChange={(value) => onPatch({ bodyFont: value })}
          fontSize={table.bodyFontSize}
          onFontSizeChange={(value) => onPatch({ bodyFontSize: value })}
          fontWeight={table.bodyFontWeight}
          onFontWeightChange={(value) => onPatch({ bodyFontWeight: value })}
          italic={table.bodyItalic}
          onItalicChange={(value) => onPatch({ bodyItalic: value })}
          decoration={table.bodyDecoration}
          onDecorationChange={(value) => onPatch({ bodyDecoration: value })}
          fontRowLabel="Body"
          fontAriaLabel="Table body font"
          weightAriaLabel="Table body weight"
        />
      </Section>
      <Section title="Columns">
        <div className="sidebar-table-editor-list">
          {table.columns.map((column, columnIndex) => (
            <div key={`column-${column}`} className="sidebar-table-editor-row">
              <TextField
                value={column}
                onChange={(value) => patchColumn(columnIndex, value)}
                className="sidebar-table-editor-input"
              />
              <button
                type="button"
                className="sidebar-action-button"
                onClick={() => removeColumn(columnIndex)}
                disabled={!canRemoveColumn}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="sidebar-action-button sidebar-action-button-full"
          onClick={addColumn}
        >
          Add column
        </button>
      </Section>
      <Section title="Rows">
        <div className="sidebar-table-row-list">
          {table.rows.map((row, rowIndex) => (
            <div key={`row-${row.join('|')}`} className="sidebar-table-row-card">
              <div className="sidebar-table-row-header">
                <span className="sidebar-table-row-title">Row {rowIndex + 1}</span>
                <button type="button" className="sidebar-action-button" onClick={() => removeRow(rowIndex)}>
                  Remove
                </button>
              </div>
              <div className="sidebar-table-grid">
                {table.columns.map((column, columnIndex) => (
                  <div key={`row-${column}-${row[columnIndex] ?? ''}`} className="sidebar-table-grid-cell">
                    <span className="sidebar-table-grid-label">{column || `Column ${columnIndex + 1}`}</span>
                    <TextField
                      value={row[columnIndex] ?? ''}
                      onChange={(value) => patchCell(rowIndex, columnIndex, value)}
                      className="sidebar-table-editor-input"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="sidebar-action-button sidebar-action-button-full" onClick={addRow}>
          Add row
        </button>
      </Section>
    </>
  );
}
