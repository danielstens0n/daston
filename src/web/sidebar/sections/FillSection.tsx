import type { FillProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  props: FillProps;
  onPatch: (patch: Partial<FillProps>) => void;
};

// Any component whose Props extend FillProps can use this section unchanged:
// structural subtyping lets you pass the wider Props in, and the outer
// inspector's patcher (which accepts the wider Partial) satisfies the
// narrower Partial<FillProps> argument by parameter contravariance.
export function FillSection({ props, onPatch }: Props) {
  return (
    <Section title="Fill">
      <FieldRow label="Color">
        <ColorField value={props.fill} onChange={(value) => onPatch({ fill: value })} />
      </FieldRow>
    </Section>
  );
}
