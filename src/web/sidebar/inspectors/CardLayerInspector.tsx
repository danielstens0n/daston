import type { CardLayerId } from '../../state/component-registry-data.ts';
import { useCardProps } from '../../state/editor.ts';
import type { CardProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { TypographyStyleRows } from '../fields/TypographyStyleRows.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { LayoutSection } from '../sections/LayoutSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';

type Props = {
  id: string;
  layerId: CardLayerId;
  onPatch: (patch: Partial<CardProps>) => void;
};

export function CardLayerInspector({ id, layerId, onPatch }: Props) {
  const props = useCardProps(id);
  if (!props) return null;

  switch (layerId) {
    case 'surface':
      return (
        <>
          <LayoutSection props={props} onPatch={onPatch} />
          <FillSection props={props} onPatch={onPatch} />
          <BorderSection props={props} onPatch={onPatch} />
          <ShadowSection props={props} onPatch={onPatch} />
        </>
      );
    case 'title':
      return (
        <CardTextLayerFields
          label="Title"
          value={props.title}
          font={props.titleFont}
          fontSize={props.titleFontSize}
          fontWeight={props.titleFontWeight}
          italic={props.titleItalic}
          decoration={props.titleDecoration}
          color={props.titleColor}
          onValueChange={(value) => onPatch({ title: value })}
          onFontChange={(value) => onPatch({ titleFont: value })}
          onFontSizeChange={(value) => onPatch({ titleFontSize: value })}
          onFontWeightChange={(value) => onPatch({ titleFontWeight: value })}
          onItalicChange={(value) => onPatch({ titleItalic: value })}
          onDecorationChange={(value) => onPatch({ titleDecoration: value })}
          onColorChange={(value) => onPatch({ titleColor: value })}
        />
      );
    case 'body':
      return (
        <CardTextLayerFields
          label="Body"
          value={props.body}
          font={props.bodyFont}
          fontSize={props.bodyFontSize}
          fontWeight={props.bodyFontWeight}
          italic={props.bodyItalic}
          decoration={props.bodyDecoration}
          color={props.bodyColor}
          onValueChange={(value) => onPatch({ body: value })}
          onFontChange={(value) => onPatch({ bodyFont: value })}
          onFontSizeChange={(value) => onPatch({ bodyFontSize: value })}
          onFontWeightChange={(value) => onPatch({ bodyFontWeight: value })}
          onItalicChange={(value) => onPatch({ bodyItalic: value })}
          onDecorationChange={(value) => onPatch({ bodyDecoration: value })}
          onColorChange={(value) => onPatch({ bodyColor: value })}
        />
      );
    default: {
      const _exhaustive: never = layerId;
      return _exhaustive;
    }
  }
}

function CardTextLayerFields({
  label,
  value,
  font,
  fontSize,
  fontWeight,
  italic,
  decoration,
  color,
  onValueChange,
  onFontChange,
  onFontSizeChange,
  onFontWeightChange,
  onItalicChange,
  onDecorationChange,
  onColorChange,
}: {
  label: string;
  value: string;
  font: string;
  fontSize: number;
  fontWeight: CardProps['titleFontWeight'];
  italic: boolean;
  decoration: CardProps['titleDecoration'];
  color: string;
  onValueChange: (value: string) => void;
  onFontChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onFontWeightChange: (value: CardProps['titleFontWeight']) => void;
  onItalicChange: (value: boolean) => void;
  onDecorationChange: (value: CardProps['titleDecoration']) => void;
  onColorChange: (value: string) => void;
}) {
  return (
    <>
      <Section title="Content">
        <FieldRow label={label}>
          <TextField value={value} onChange={onValueChange} />
        </FieldRow>
      </Section>
      <Section title="Typography">
        <TypographyStyleRows
          font={font}
          onFontChange={onFontChange}
          fontSize={fontSize}
          onFontSizeChange={onFontSizeChange}
          fontWeight={fontWeight}
          onFontWeightChange={onFontWeightChange}
          italic={italic}
          onItalicChange={onItalicChange}
          decoration={decoration}
          onDecorationChange={onDecorationChange}
          fontRowLabel="Font"
          fontAriaLabel={`${label} font`}
          weightAriaLabel={`${label} weight`}
        />
      </Section>
      <Section title="Text">
        <FieldRow label="Color">
          <ColorField value={color} onChange={onColorChange} />
        </FieldRow>
      </Section>
    </>
  );
}
