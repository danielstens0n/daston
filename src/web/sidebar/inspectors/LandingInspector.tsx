import { useLandingProps } from '../../state/editor.ts';
import type { LandingProps } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { DecorationField } from '../fields/DecorationField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { FontField } from '../fields/FontField.tsx';
import { INSPECTOR_FONT_SIZE_FIELD } from '../fields/inspectorFontSizeProps.ts';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';
import { WeightField } from '../fields/WeightField.tsx';
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
        <FieldRow label="Heading">
          <FontField
            value={props.headingFont}
            onChange={(value) => onPatch({ headingFont: value })}
            ariaLabel="Landing heading font"
          />
        </FieldRow>
        <FieldRow label="Size">
          <NumberField
            value={props.headingFontSize}
            onChange={(value) => onPatch({ headingFontSize: value })}
            {...INSPECTOR_FONT_SIZE_FIELD}
          />
        </FieldRow>
        <FieldRow label="Weight">
          <WeightField
            value={props.headingFontWeight}
            onChange={(value) => onPatch({ headingFontWeight: value })}
            ariaLabel="Landing heading weight"
          />
        </FieldRow>
        <FieldRow label="Italic">
          <ToggleField value={props.headingItalic} onChange={(value) => onPatch({ headingItalic: value })} />
        </FieldRow>
        <FieldRow label="Deco">
          <DecorationField
            value={props.headingDecoration}
            onChange={(value) => onPatch({ headingDecoration: value })}
          />
        </FieldRow>
        <FieldRow label="Body">
          <FontField
            value={props.bodyFont}
            onChange={(value) => onPatch({ bodyFont: value })}
            ariaLabel="Landing body font"
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
            ariaLabel="Landing body weight"
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
