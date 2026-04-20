import {
  buildTypographyPartial,
  useLandingProps,
  useTypographyScope,
  useUpdateProps,
} from '../../state/editor.ts';
import type { LandingProps, TypographyValues } from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { TextLayerFields } from '../sections/TextLayerFields.tsx';

type Props = {
  id: string;
  layerId: string;
};

function LayerHint({ message }: { message: string }) {
  return (
    <Section title="Layer">
      <p className="sidebar-help-text">{message}</p>
    </Section>
  );
}

function LandingHeroPanel({ id }: { id: string }) {
  const props = useLandingProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <Section title="Colors">
        <FieldRow label="Hero">
          <ColorField value={props.heroFill} onChange={(value) => onPatch({ heroFill: value })} />
        </FieldRow>
        <FieldRow label="Page">
          <ColorField value={props.pageFill} onChange={(value) => onPatch({ pageFill: value })} />
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
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<LandingProps>) => void} />
    </>
  );
}

function LandingHeroSurfacePanel({ id }: { id: string }) {
  const props = useLandingProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <Section title="Colors">
        <FieldRow label="Hero">
          <ColorField value={props.heroFill} onChange={(value) => onPatch({ heroFill: value })} />
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
    </>
  );
}

function LandingHeroTitlePanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'landing-heading');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      fontRowLabel="Heading"
      fontAriaLabel="Landing hero title font"
      weightAriaLabel="Landing hero title weight"
      showColorSection={false}
    />
  );
}

function LandingHeroBodyPanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'landing-body');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      fontRowLabel="Body"
      fontAriaLabel="Landing hero body font"
      weightAriaLabel="Landing hero body weight"
      showColorSection={false}
    />
  );
}

function LandingFeaturesPanel({ id }: { id: string }) {
  const props = useLandingProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  const bodyValues: TypographyValues = {
    font: props.bodyFont,
    fontSize: props.bodyFontSize,
    fontWeight: props.bodyFontWeight,
    italic: props.bodyItalic,
    decoration: props.bodyDecoration,
  };
  const onBodyTypography = (patch: Partial<TypographyValues>) => {
    const mapped = buildTypographyPartial('landing-body', patch);
    if (mapped) onPatch(mapped);
  };
  return (
    <>
      <Section title="Colors">
        <FieldRow label="Features">
          <ColorField value={props.featuresFill} onChange={(value) => onPatch({ featuresFill: value })} />
        </FieldRow>
      </Section>
      <TextLayerFields
        values={bodyValues}
        onChange={onBodyTypography}
        fontRowLabel="Body"
        fontAriaLabel="Landing body font"
        weightAriaLabel="Landing body weight"
        showColorSection={false}
      />
    </>
  );
}

function LandingFeaturesSurfacePanel({ id }: { id: string }) {
  const props = useLandingProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <Section title="Colors">
      <FieldRow label="Features">
        <ColorField value={props.featuresFill} onChange={(value) => onPatch({ featuresFill: value })} />
      </FieldRow>
    </Section>
  );
}

function LandingFeaturesTitlePanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'landing-heading');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      fontRowLabel="Heading"
      fontAriaLabel="Landing features title font"
      weightAriaLabel="Landing features title weight"
      showColorSection={false}
    />
  );
}

function LandingCtaPanel({ id }: { id: string }) {
  const props = useLandingProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <Section title="Colors">
        <FieldRow label="Accent">
          <ColorField value={props.accentColor} onChange={(value) => onPatch({ accentColor: value })} />
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
    </>
  );
}

function LandingCtaLabelPanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'landing-heading');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      fontRowLabel="Heading"
      fontAriaLabel="Landing CTA label font"
      weightAriaLabel="Landing CTA label weight"
      showColorSection={false}
    />
  );
}

export function LandingLayerInspector({ id, layerId }: Props) {
  if (/^feature-\d+$/.test(layerId)) {
    return <LayerHint message="Edit feature text on the canvas. Right-click for item actions." />;
  }

  switch (layerId) {
    case 'hero':
      return <LandingHeroPanel id={id} />;
    case 'hero-surface':
      return <LandingHeroSurfacePanel id={id} />;
    case 'hero-title':
      return <LandingHeroTitlePanel id={id} />;
    case 'hero-body':
      return <LandingHeroBodyPanel id={id} />;
    case 'features':
      return <LandingFeaturesPanel id={id} />;
    case 'features-surface':
      return <LandingFeaturesSurfacePanel id={id} />;
    case 'features-title':
      return <LandingFeaturesTitlePanel id={id} />;
    case 'features-list':
      return <LayerHint message="Add or remove features via right-click on this row or a feature item." />;
    case 'cta':
    case 'cta-surface':
      return <LandingCtaPanel id={id} />;
    case 'cta-label':
      return <LandingCtaLabelPanel id={id} />;
    default:
      return null;
  }
}
