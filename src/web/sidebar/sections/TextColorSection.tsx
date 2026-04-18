import type { TextColorProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  props: TextColorProps;
  onPatch: (patch: Partial<TextColorProps>) => void;
};

export function TextColorSection({ props, onPatch }: Props) {
  return (
    <Section title="Text">
      <FieldRow label="Title">
        <ColorField value={props.titleColor} onChange={(value) => onPatch({ titleColor: value })} />
      </FieldRow>
      <FieldRow label="Body">
        <ColorField value={props.bodyColor} onChange={(value) => onPatch({ bodyColor: value })} />
      </FieldRow>
    </Section>
  );
}
