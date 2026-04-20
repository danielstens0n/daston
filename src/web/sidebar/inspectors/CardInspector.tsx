import { useCardProps } from '../../state/editor.ts';
import type { CardProps } from '../../state/types.ts';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { TypographyStyleRows } from '../fields/TypographyStyleRows.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { LayoutSection } from '../sections/LayoutSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { TextColorSection } from '../sections/TextColorSection.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<CardProps>) => void;
};

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
        <TypographyStyleRows
          font={props.titleFont}
          onFontChange={(value) => onPatch({ titleFont: value })}
          fontSize={props.titleFontSize}
          onFontSizeChange={(value) => onPatch({ titleFontSize: value })}
          fontWeight={props.titleFontWeight}
          onFontWeightChange={(value) => onPatch({ titleFontWeight: value })}
          italic={props.titleItalic}
          onItalicChange={(value) => onPatch({ titleItalic: value })}
          decoration={props.titleDecoration}
          onDecorationChange={(value) => onPatch({ titleDecoration: value })}
          fontRowLabel="Title"
          fontAriaLabel="Title font"
          weightAriaLabel="Card title weight"
        />
        <TypographyStyleRows
          font={props.bodyFont}
          onFontChange={(value) => onPatch({ bodyFont: value })}
          fontSize={props.bodyFontSize}
          onFontSizeChange={(value) => onPatch({ bodyFontSize: value })}
          fontWeight={props.bodyFontWeight}
          onFontWeightChange={(value) => onPatch({ bodyFontWeight: value })}
          italic={props.bodyItalic}
          onItalicChange={(value) => onPatch({ bodyItalic: value })}
          decoration={props.bodyDecoration}
          onDecorationChange={(value) => onPatch({ bodyDecoration: value })}
          fontRowLabel="Body"
          fontAriaLabel="Body font"
          weightAriaLabel="Card body weight"
        />
      </Section>
      <LayoutSection props={props} onPatch={onPatch} />
      <FillSection props={props} onPatch={onPatch} />
      <BorderSection props={props} onPatch={onPatch} />
      <ShadowSection props={props} onPatch={onPatch} />
      <TextColorSection props={props} onPatch={onPatch} />
    </>
  );
}
