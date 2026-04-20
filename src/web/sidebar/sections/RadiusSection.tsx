import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
};

export function RadiusSection({ value, onChange, max = 64 }: Props) {
  return (
    <Section title="Corner radius">
      <FieldRow label="Radius">
        <NumberField value={value} onChange={onChange} min={0} max={max} unit="px" />
      </FieldRow>
    </Section>
  );
}
