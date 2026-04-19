import { useButtonProps } from '../../state/editor.ts';
import type { ButtonProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { FontField } from '../fields/FontField.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<ButtonProps>) => void;
};

export function ButtonInspector({ id, onPatch }: Props) {
  const props = useButtonProps(id);
  if (!props) return null;

  return (
    <>
      <Section title="Content">
        <FieldRow label="Label">
          <TextField value={props.label} onChange={(value) => onPatch({ label: value })} />
        </FieldRow>
        <FieldRow label="Text">
          <ColorField value={props.textColor} onChange={(value) => onPatch({ textColor: value })} />
        </FieldRow>
      </Section>
      <Section title="Typography">
        <FieldRow label="Label">
          <FontField
            value={props.labelFont}
            onChange={(value) => onPatch({ labelFont: value })}
            ariaLabel="Label font"
          />
        </FieldRow>
      </Section>
      <Section title="Layout">
        <FieldRow label="Pad X">
          <NumberField
            value={props.paddingX}
            onChange={(value) => onPatch({ paddingX: value })}
            min={0}
            max={64}
            unit="px"
          />
        </FieldRow>
        <FieldRow label="Pad Y">
          <NumberField
            value={props.paddingY}
            onChange={(value) => onPatch({ paddingY: value })}
            min={0}
            max={64}
            unit="px"
          />
        </FieldRow>
      </Section>
      <FillSection props={props} onPatch={onPatch} />
      <BorderSection props={props} onPatch={onPatch} />
      <ShadowSection props={props} onPatch={onPatch} />
    </>
  );
}
