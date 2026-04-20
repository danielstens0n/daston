import type { BorderProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  props: BorderProps;
  onPatch: (patch: Partial<BorderProps>) => void;
};

export function BorderSection({ props, onPatch }: Props) {
  return (
    <Section
      title="Border"
      enabled={props.borderEnabled}
      onAdd={() => onPatch({ borderEnabled: true })}
      onRemove={() => onPatch({ borderEnabled: false })}
    >
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
    </Section>
  );
}
