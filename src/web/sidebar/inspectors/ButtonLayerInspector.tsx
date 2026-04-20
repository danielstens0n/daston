import { useButtonProps, useTypographyScope, useUpdateProps } from '../../state/editor.ts';
import type { ButtonProps } from '../../state/types.ts';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { TextLayerFields } from '../sections/TextLayerFields.tsx';

type Props = {
  id: string;
  layerId: string;
};

export function ButtonLayerInspector({ id, layerId }: Props) {
  if (layerId === 'surface') {
    return <ButtonSurfacePanel id={id} />;
  }
  if (layerId === 'label') {
    return <ButtonLabelPanel id={id} />;
  }
  return null;
}

function ButtonSurfacePanel({ id }: { id: string }) {
  const props = useButtonProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <FillSection props={props} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />
      <BorderSection props={props} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />
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
    </>
  );
}

function ButtonLabelPanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'button-label');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      color={t.color}
      onColorChange={t.onColorChange}
      fontAriaLabel="Button label font"
      weightAriaLabel="Button label weight"
    />
  );
}
