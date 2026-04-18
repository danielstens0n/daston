import type { LayoutProps } from '../../state/types.ts';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  props: LayoutProps;
  onPatch: (patch: Partial<LayoutProps>) => void;
};

export function LayoutSection({ props, onPatch }: Props) {
  return (
    <Section title="Layout">
      <FieldRow label="Width">
        <NumberField
          value={props.width}
          onChange={(value) => onPatch({ width: value })}
          min={80}
          max={800}
          unit="px"
        />
      </FieldRow>
      <FieldRow label="Padding">
        <NumberField
          value={props.padding}
          onChange={(value) => onPatch({ padding: value })}
          min={0}
          max={64}
          unit="px"
        />
      </FieldRow>
    </Section>
  );
}
