import type { TypographyValues } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';
import { TypographyStyleRows } from '../fields/TypographyStyleRows.tsx';

type Props = {
  values: TypographyValues;
  onChange: (patch: Partial<TypographyValues>) => void;
  color?: string | undefined;
  onColorChange?: ((value: string) => void) | undefined;
  fontRowLabel?: string;
  fontAriaLabel: string;
  weightAriaLabel: string;
  showColorSection?: boolean;
};

export function TextLayerFields({
  values,
  onChange,
  color,
  onColorChange,
  fontRowLabel = 'Font',
  fontAriaLabel,
  weightAriaLabel,
  showColorSection = true,
}: Props) {
  return (
    <>
      <Section title="Typography">
        <TypographyStyleRows
          values={values}
          onChange={onChange}
          fontRowLabel={fontRowLabel}
          fontAriaLabel={fontAriaLabel}
          weightAriaLabel={weightAriaLabel}
        />
      </Section>
      {(showColorSection ?? true) && color !== undefined && onColorChange ? (
        <Section title="Text">
          <FieldRow label="Color">
            <ColorField value={color} onChange={onColorChange} />
          </FieldRow>
        </Section>
      ) : null}
    </>
  );
}
