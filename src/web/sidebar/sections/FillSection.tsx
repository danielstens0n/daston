import type { FillProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  props: FillProps;
  onPatch: (patch: Partial<FillProps>) => void;
};

// Callers often pass a wider `props` + `onPatch`; that still type-checks for Fill fields only.
export function FillSection({ props, onPatch }: Props) {
  return (
    <Section
      title="Fill"
      enabled={props.fillEnabled}
      onAdd={() => onPatch({ fillEnabled: true })}
      onRemove={() => onPatch({ fillEnabled: false })}
    >
      <FieldRow label="Color">
        <ColorField value={props.fill} onChange={(value) => onPatch({ fill: value })} />
      </FieldRow>
    </Section>
  );
}
