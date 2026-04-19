import { useTableProps } from '../../state/editor.ts';
import type { TableProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<TableProps>) => void;
};

export function TableInspector({ id, onPatch }: Props) {
  const props = useTableProps(id);
  if (!props) return null;

  return (
    <>
      <Section title="Table">
        <FieldRow label="Header row">
          <ToggleField value={props.showHeader} onChange={(value) => onPatch({ showHeader: value })} />
        </FieldRow>
        <FieldRow label="Zebra">
          <ToggleField value={props.zebra} onChange={(value) => onPatch({ zebra: value })} />
        </FieldRow>
        <FieldRow label="Cell pad">
          <NumberField
            value={props.cellPadding}
            onChange={(value) => onPatch({ cellPadding: value })}
            min={0}
            max={32}
            unit="px"
          />
        </FieldRow>
      </Section>
      <Section title="Fills">
        <FieldRow label="Header">
          <ColorField value={props.headerFill} onChange={(value) => onPatch({ headerFill: value })} />
        </FieldRow>
        <FieldRow label="Row">
          <ColorField value={props.rowFill} onChange={(value) => onPatch({ rowFill: value })} />
        </FieldRow>
        <FieldRow label="Alt row">
          <ColorField value={props.rowFillAlt} onChange={(value) => onPatch({ rowFillAlt: value })} />
        </FieldRow>
      </Section>
      <Section title="Border">
        <FieldRow label="Color">
          <ColorField value={props.borderColor} onChange={(value) => onPatch({ borderColor: value })} />
        </FieldRow>
        <FieldRow label="Width">
          <NumberField
            value={props.borderWidth}
            onChange={(value) => onPatch({ borderWidth: value })}
            min={0}
            max={12}
            unit="px"
          />
        </FieldRow>
        <FieldRow label="Radius">
          <NumberField
            value={props.borderRadius}
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
            value={props.headerTextColor}
            onChange={(value) => onPatch({ headerTextColor: value })}
          />
        </FieldRow>
        <FieldRow label="Body">
          <ColorField value={props.bodyTextColor} onChange={(value) => onPatch({ bodyTextColor: value })} />
        </FieldRow>
      </Section>
    </>
  );
}
