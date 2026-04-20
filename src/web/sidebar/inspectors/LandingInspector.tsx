import { useLandingProps } from '../../state/editor.ts';
import type { LandingProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { TypographyStyleRows } from '../fields/TypographyStyleRows.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<LandingProps>) => void;
};

export function LandingInspector({ id, onPatch }: Props) {
  const props = useLandingProps(id);
  if (!props) return null;

  return (
    <>
      <Section title="Hero">
        <FieldRow label="Title">
          <TextField value={props.heroTitle} onChange={(value) => onPatch({ heroTitle: value })} />
        </FieldRow>
        <FieldRow label="Body">
          <TextField value={props.heroBody} onChange={(value) => onPatch({ heroBody: value })} />
        </FieldRow>
        <FieldRow label="CTA">
          <TextField value={props.ctaLabel} onChange={(value) => onPatch({ ctaLabel: value })} />
        </FieldRow>
      </Section>
      <Section title="Features">
        <FieldRow label="Title">
          <TextField value={props.featuresTitle} onChange={(value) => onPatch({ featuresTitle: value })} />
        </FieldRow>
        {props.features.map((feature, index) => (
          <FieldRow key={`feature-${feature}`} label={`Item ${index + 1}`}>
            <TextField
              value={feature}
              onChange={(value) =>
                onPatch({
                  features: props.features.map((entry, featureIndex) =>
                    featureIndex === index ? value : entry,
                  ),
                })
              }
            />
          </FieldRow>
        ))}
      </Section>
      <Section title="Typography">
        <TypographyStyleRows
          font={props.headingFont}
          onFontChange={(value) => onPatch({ headingFont: value })}
          fontSize={props.headingFontSize}
          onFontSizeChange={(value) => onPatch({ headingFontSize: value })}
          fontWeight={props.headingFontWeight}
          onFontWeightChange={(value) => onPatch({ headingFontWeight: value })}
          italic={props.headingItalic}
          onItalicChange={(value) => onPatch({ headingItalic: value })}
          decoration={props.headingDecoration}
          onDecorationChange={(value) => onPatch({ headingDecoration: value })}
          fontRowLabel="Heading"
          fontAriaLabel="Landing heading font"
          weightAriaLabel="Landing heading weight"
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
          fontAriaLabel="Landing body font"
          weightAriaLabel="Landing body weight"
        />
      </Section>
      <Section title="Colors">
        <FieldRow label="Accent">
          <ColorField value={props.accentColor} onChange={(value) => onPatch({ accentColor: value })} />
        </FieldRow>
        <FieldRow label="Page">
          <ColorField value={props.pageFill} onChange={(value) => onPatch({ pageFill: value })} />
        </FieldRow>
        <FieldRow label="Hero">
          <ColorField value={props.heroFill} onChange={(value) => onPatch({ heroFill: value })} />
        </FieldRow>
        <FieldRow label="Features">
          <ColorField value={props.featuresFill} onChange={(value) => onPatch({ featuresFill: value })} />
        </FieldRow>
      </Section>
      <Section title="Shape">
        <FieldRow label="Radius">
          <NumberField
            value={props.borderRadius}
            onChange={(value) => onPatch({ borderRadius: value })}
            min={0}
            max={48}
            unit="px"
          />
        </FieldRow>
      </Section>
      <ShadowSection props={props} onPatch={onPatch} />
    </>
  );
}
