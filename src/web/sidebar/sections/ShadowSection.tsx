import type { ShadowProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';

type Props = {
  props: ShadowProps;
  onPatch: (patch: Partial<ShadowProps>) => void;
};

export function ShadowSection({ props, onPatch }: Props) {
  return (
    <Section title="Shadow">
      <FieldRow label="Enabled">
        <ToggleField value={props.shadowEnabled} onChange={(value) => onPatch({ shadowEnabled: value })} />
      </FieldRow>
      <FieldRow label="Color">
        <ColorField value={props.shadowColor} onChange={(value) => onPatch({ shadowColor: value })} />
      </FieldRow>
      <FieldRow label="Blur">
        <NumberField
          value={props.shadowBlur}
          onChange={(value) => onPatch({ shadowBlur: value })}
          min={0}
          max={64}
          unit="px"
        />
      </FieldRow>
      <FieldRow label="Offset Y">
        <NumberField
          value={props.shadowOffsetY}
          onChange={(value) => onPatch({ shadowOffsetY: value })}
          min={-32}
          max={32}
          unit="px"
        />
      </FieldRow>
    </Section>
  );
}
