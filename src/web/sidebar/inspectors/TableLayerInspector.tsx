import { buildTypographyPartial, useTableProps, useUpdateProps } from '../../state/editor.ts';
import type { TableProps, TypographyValues } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { RadiusSection } from '../sections/RadiusSection.tsx';
import { TextLayerFields } from '../sections/TextLayerFields.tsx';

type Props = {
  id: string;
  layerId: string;
};

function LayerHint({ message }: { message: string }) {
  return (
    <Section title="Layer">
      <p className="sidebar-help-text">{message}</p>
    </Section>
  );
}

function TableHeaderPanel({ id }: { id: string }) {
  const table = useTableProps(id);
  const updateProps = useUpdateProps(id);
  if (!table) return null;
  const values: TypographyValues = {
    font: table.headerFont,
    fontSize: table.headerFontSize,
    fontWeight: table.headerFontWeight,
    italic: table.headerItalic,
    decoration: table.headerDecoration,
  };
  const onTypographyChange = (patch: Partial<TypographyValues>) => {
    const mapped = buildTypographyPartial('table-header', patch);
    if (mapped) updateProps(mapped);
  };
  return (
    <>
      <Section title="Table">
        <FieldRow label="Header row">
          <ToggleField value={table.showHeader} onChange={(value) => updateProps({ showHeader: value })} />
        </FieldRow>
      </Section>
      <TextLayerFields
        values={values}
        onChange={onTypographyChange}
        color={table.headerTextColor}
        onColorChange={(value) => updateProps({ headerTextColor: value })}
        fontRowLabel="Header"
        fontAriaLabel="Table header font"
        weightAriaLabel="Table header weight"
      />
    </>
  );
}

function TableBodyPanel({ id }: { id: string }) {
  const table = useTableProps(id);
  const updateProps = useUpdateProps(id);
  if (!table) return null;
  const values: TypographyValues = {
    font: table.bodyFont,
    fontSize: table.bodyFontSize,
    fontWeight: table.bodyFontWeight,
    italic: table.bodyItalic,
    decoration: table.bodyDecoration,
  };
  const onTypographyChange = (patch: Partial<TypographyValues>) => {
    const mapped = buildTypographyPartial('table-body', patch);
    if (mapped) updateProps(mapped);
  };
  return (
    <>
      <Section title="Table">
        <FieldRow label="Zebra">
          <ToggleField value={table.zebra} onChange={(value) => updateProps({ zebra: value })} />
        </FieldRow>
      </Section>
      <Section title="Fills">
        <FieldRow label="Row">
          <ColorField value={table.rowFill} onChange={(value) => updateProps({ rowFill: value })} />
        </FieldRow>
        <FieldRow label="Alt row">
          <ColorField value={table.rowFillAlt} onChange={(value) => updateProps({ rowFillAlt: value })} />
        </FieldRow>
      </Section>
      <TextLayerFields
        values={values}
        onChange={onTypographyChange}
        color={table.bodyTextColor}
        onColorChange={(value) => updateProps({ bodyTextColor: value })}
        fontRowLabel="Body"
        fontAriaLabel="Table body font"
        weightAriaLabel="Table body weight"
      />
    </>
  );
}

function TableHeaderSurfacePanel({ id }: { id: string }) {
  const table = useTableProps(id);
  const updateProps = useUpdateProps(id);
  if (!table) return null;
  return (
    <>
      <Section title="Fills">
        <FieldRow label="Header">
          <ColorField value={table.headerFill} onChange={(value) => updateProps({ headerFill: value })} />
        </FieldRow>
      </Section>
      <BorderSection props={table} onPatch={updateProps as (patch: Partial<TableProps>) => void} />
      <RadiusSection
        value={table.borderRadius}
        onChange={(value) => updateProps({ borderRadius: value })}
        max={32}
      />
      <Section title="Layout">
        <FieldRow label="Cell pad">
          <NumberField
            value={table.cellPadding}
            onChange={(value) => updateProps({ cellPadding: value })}
            min={0}
            max={32}
            unit="px"
          />
        </FieldRow>
      </Section>
    </>
  );
}

export function TableLayerInspector({ id, layerId }: Props) {
  if (/^col-\d+$/.test(layerId)) {
    return <LayerHint message="Edit the header text on the canvas. Right-click for column actions." />;
  }
  if (/^row-\d+$/.test(layerId)) {
    return <LayerHint message="Edit cell values on the canvas. Right-click for row actions." />;
  }

  switch (layerId) {
    case 'header':
    case 'columns':
      return <TableHeaderPanel id={id} />;
    case 'header-surface':
      return <TableHeaderSurfacePanel id={id} />;
    case 'body':
    case 'rows':
      return <TableBodyPanel id={id} />;
    default:
      return null;
  }
}
