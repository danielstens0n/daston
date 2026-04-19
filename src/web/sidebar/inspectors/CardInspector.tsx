import { useCardProps } from '../../state/editor.ts';
import type { CardProps } from '../../state/types.ts';
import { DecorationField } from '../fields/DecorationField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { FontField } from '../fields/FontField.tsx';
import { INSPECTOR_FONT_SIZE_FIELD } from '../fields/inspectorFontSizeProps.ts';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';
import { WeightField } from '../fields/WeightField.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { LayoutSection } from '../sections/LayoutSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { TextColorSection } from '../sections/TextColorSection.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<CardProps>) => void;
};

// Props come from `useCardProps` so this subtree does not re-render on unrelated store updates.
export function CardInspector({ id, onPatch }: Props) {
  const props = useCardProps(id);
  if (!props) return null;
  return (
    <>
      <Section title="Content">
        <FieldRow label="Title">
          <TextField value={props.title} onChange={(value) => onPatch({ title: value })} />
        </FieldRow>
        <FieldRow label="Body">
          <TextField value={props.body} onChange={(value) => onPatch({ body: value })} />
        </FieldRow>
      </Section>
      <Section title="Typography">
        <FieldRow label="Title">
          <FontField
            value={props.titleFont}
            onChange={(value) => onPatch({ titleFont: value })}
            ariaLabel="Title font"
          />
        </FieldRow>
        <FieldRow label="Size">
          <NumberField
            value={props.titleFontSize}
            onChange={(value) => onPatch({ titleFontSize: value })}
            {...INSPECTOR_FONT_SIZE_FIELD}
          />
        </FieldRow>
        <FieldRow label="Weight">
          <WeightField
            value={props.titleFontWeight}
            onChange={(value) => onPatch({ titleFontWeight: value })}
            ariaLabel="Card title weight"
          />
        </FieldRow>
        <FieldRow label="Italic">
          <ToggleField value={props.titleItalic} onChange={(value) => onPatch({ titleItalic: value })} />
        </FieldRow>
        <FieldRow label="Deco">
          <DecorationField
            value={props.titleDecoration}
            onChange={(value) => onPatch({ titleDecoration: value })}
          />
        </FieldRow>
        <FieldRow label="Body">
          <FontField
            value={props.bodyFont}
            onChange={(value) => onPatch({ bodyFont: value })}
            ariaLabel="Body font"
          />
        </FieldRow>
        <FieldRow label="Size">
          <NumberField
            value={props.bodyFontSize}
            onChange={(value) => onPatch({ bodyFontSize: value })}
            {...INSPECTOR_FONT_SIZE_FIELD}
          />
        </FieldRow>
        <FieldRow label="Weight">
          <WeightField
            value={props.bodyFontWeight}
            onChange={(value) => onPatch({ bodyFontWeight: value })}
            ariaLabel="Card body weight"
          />
        </FieldRow>
        <FieldRow label="Italic">
          <ToggleField value={props.bodyItalic} onChange={(value) => onPatch({ bodyItalic: value })} />
        </FieldRow>
        <FieldRow label="Deco">
          <DecorationField
            value={props.bodyDecoration}
            onChange={(value) => onPatch({ bodyDecoration: value })}
          />
        </FieldRow>
      </Section>
      <LayoutSection props={props} onPatch={onPatch} />
      <FillSection props={props} onPatch={onPatch} />
      <BorderSection props={props} onPatch={onPatch} />
      <ShadowSection props={props} onPatch={onPatch} />
      <TextColorSection props={props} onPatch={onPatch} />
    </>
  );
}
