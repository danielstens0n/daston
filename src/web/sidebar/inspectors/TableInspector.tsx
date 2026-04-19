import { useTableProps } from '../../state/editor.ts';
import type { TableProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { FontField } from '../fields/FontField.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<TableProps>) => void;
};

export function TableInspector({ id, onPatch }: Props) {
  const props = useTableProps(id);
  if (!props) return null;
  const tableProps = props;

  const canRemoveColumn = tableProps.columns.length > 1;

  function patchColumn(columnIndex: number, value: string) {
    onPatch({
      columns: tableProps.columns.map((entry, index) => (index === columnIndex ? value : entry)),
    });
  }

  function patchCell(rowIndex: number, columnIndex: number, value: string) {
    onPatch({
      rows: tableProps.rows.map((row, index) =>
        index === rowIndex
          ? tableProps.columns.map((_, cellIndex) =>
              cellIndex === columnIndex ? value : (row[cellIndex] ?? ''),
            )
          : row,
      ),
    });
  }

  function addColumn() {
    onPatch({
      columns: [...tableProps.columns, `Column ${tableProps.columns.length + 1}`],
      rows: tableProps.rows.map((row) => [...row, '']),
    });
  }

  function removeColumn(columnIndex: number) {
    if (!canRemoveColumn) return;
    onPatch({
      columns: tableProps.columns.filter((_, index) => index !== columnIndex),
      rows: tableProps.rows.map((row) => row.filter((_, index) => index !== columnIndex)),
    });
  }

  function addRow() {
    onPatch({
      rows: [...tableProps.rows, tableProps.columns.map(() => '')],
    });
  }

  function removeRow(rowIndex: number) {
    onPatch({
      rows: tableProps.rows.filter((_, index) => index !== rowIndex),
    });
  }

  return (
    <>
      <Section title="Table">
        <FieldRow label="Header row">
          <ToggleField value={tableProps.showHeader} onChange={(value) => onPatch({ showHeader: value })} />
        </FieldRow>
        <FieldRow label="Zebra">
          <ToggleField value={tableProps.zebra} onChange={(value) => onPatch({ zebra: value })} />
        </FieldRow>
        <FieldRow label="Cell pad">
          <NumberField
            value={tableProps.cellPadding}
            onChange={(value) => onPatch({ cellPadding: value })}
            min={0}
            max={32}
            unit="px"
          />
        </FieldRow>
      </Section>
      <Section title="Fills">
        <FieldRow label="Header">
          <ColorField value={tableProps.headerFill} onChange={(value) => onPatch({ headerFill: value })} />
        </FieldRow>
        <FieldRow label="Row">
          <ColorField value={tableProps.rowFill} onChange={(value) => onPatch({ rowFill: value })} />
        </FieldRow>
        <FieldRow label="Alt row">
          <ColorField value={tableProps.rowFillAlt} onChange={(value) => onPatch({ rowFillAlt: value })} />
        </FieldRow>
      </Section>
      <Section title="Border">
        <FieldRow label="Color">
          <ColorField value={tableProps.borderColor} onChange={(value) => onPatch({ borderColor: value })} />
        </FieldRow>
        <FieldRow label="Width">
          <NumberField
            value={tableProps.borderWidth}
            onChange={(value) => onPatch({ borderWidth: value })}
            min={0}
            max={12}
            unit="px"
          />
        </FieldRow>
        <FieldRow label="Radius">
          <NumberField
            value={tableProps.borderRadius}
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
            value={tableProps.headerTextColor}
            onChange={(value) => onPatch({ headerTextColor: value })}
          />
        </FieldRow>
        <FieldRow label="Body">
          <ColorField
            value={tableProps.bodyTextColor}
            onChange={(value) => onPatch({ bodyTextColor: value })}
          />
        </FieldRow>
      </Section>
      <Section title="Typography">
        <FieldRow label="Header">
          <FontField
            value={tableProps.headerFont}
            onChange={(value) => onPatch({ headerFont: value })}
            ariaLabel="Table header font"
          />
        </FieldRow>
        <FieldRow label="Body">
          <FontField
            value={tableProps.bodyFont}
            onChange={(value) => onPatch({ bodyFont: value })}
            ariaLabel="Table body font"
          />
        </FieldRow>
      </Section>
      <Section title="Columns">
        <div className="sidebar-table-editor-list">
          {tableProps.columns.map((column, columnIndex) => (
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
          {tableProps.rows.map((row, rowIndex) => (
            <div key={`row-${row.join('|')}`} className="sidebar-table-row-card">
              <div className="sidebar-table-row-header">
                <span className="sidebar-table-row-title">Row {rowIndex + 1}</span>
                <button type="button" className="sidebar-action-button" onClick={() => removeRow(rowIndex)}>
                  Remove
                </button>
              </div>
              <div className="sidebar-table-grid">
                {tableProps.columns.map((column, columnIndex) => (
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
