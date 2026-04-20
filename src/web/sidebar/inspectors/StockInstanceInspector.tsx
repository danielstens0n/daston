import { getFontLabel } from '../../lib/fonts.ts';
import {
  type TypographyScopeId,
  useButtonProps,
  useCardProps,
  useEditorStore,
  useLandingProps,
  useShapeProps,
  useTableProps,
  useTextPrimitiveProps,
  useTypographyScope,
  useUpdateProps,
} from '../../state/editor.ts';
import { layerSelection } from '../../state/layers.ts';
import type {
  ButtonProps,
  CardProps,
  ComponentInstance,
  LandingProps,
  TableProps,
  TextAlign,
} from '../../state/types.ts';
import { ColorField } from '../fields/ColorField.tsx';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';
import { ToggleField } from '../fields/ToggleField.tsx';
import { TypographyStyleRows } from '../fields/TypographyStyleRows.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { LayoutSection } from '../sections/LayoutSection.tsx';
import { RadiusSection } from '../sections/RadiusSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { FrameInspector } from './FrameInspector.tsx';

type Props = {
  id: string;
  type: Exclude<ComponentInstance['type'], 'imported'>;
};

type TextStyleOverviewItem = {
  label: string;
  layerId: string;
  scope: TypographyScopeId;
  note?: string;
};

export function StockInstanceInspector({ id, type }: Props) {
  return (
    <>
      <FrameInspector id={id} />
      {renderOverview(type, id)}
    </>
  );
}

function renderOverview(type: Props['type'], id: string) {
  switch (type) {
    case 'card':
      return <CardRootInspector id={id} />;
    case 'button':
      return <ButtonRootInspector id={id} />;
    case 'table':
      return <TableRootInspector id={id} />;
    case 'landing':
      return <LandingRootInspector id={id} />;
    case 'rectangle':
      return <ShapeRootInspector id={id} showRadius />;
    case 'ellipse':
    case 'triangle':
      return <ShapeRootInspector id={id} showRadius={false} />;
    case 'text':
      return <TextPrimitiveFields id={id} />;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function ShapeRootInspector({ id, showRadius }: { id: string; showRadius: boolean }) {
  const props = useShapeProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <FillSection props={props} onPatch={onPatch as (patch: Partial<typeof props>) => void} />
      <BorderSection props={props} onPatch={onPatch as (patch: Partial<typeof props>) => void} />
      {showRadius ? (
        <RadiusSection value={props.borderRadius} onChange={(value) => onPatch({ borderRadius: value })} />
      ) : null}
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<typeof props>) => void} />
    </>
  );
}

const TEXT_ALIGNS: readonly TextAlign[] = ['left', 'center', 'right'];

/** Text primitive: color, alignment, and typography (instance or `text` layer). */
export function TextPrimitiveFields({ id }: { id: string }) {
  const props = useTextPrimitiveProps(id);
  const onPatch = useUpdateProps(id);
  const typo = useTypographyScope(id, 'text-root');
  if (!props || !typo) return null;
  return (
    <>
      <Section title="Text">
        <FieldRow label="Color">
          <ColorField
            value={typo.color ?? props.textColor}
            onChange={(value) =>
              typo.onColorChange ? typo.onColorChange(value) : onPatch({ textColor: value })
            }
          />
        </FieldRow>
        <FieldRow label="Align">
          <div className="sidebar-align-row">
            {TEXT_ALIGNS.map((align: TextAlign) => (
              <button
                key={align}
                type="button"
                className="sidebar-align-button"
                data-active={props.textAlign === align || undefined}
                onClick={() => onPatch({ textAlign: align })}
              >
                {align}
              </button>
            ))}
          </div>
        </FieldRow>
      </Section>
      <Section title="Typography">
        <TypographyStyleRows
          values={typo.values}
          onChange={typo.onChange}
          fontRowLabel="Font"
          fontAriaLabel="Text font"
          weightAriaLabel="Text weight"
        />
      </Section>
    </>
  );
}

function CardRootInspector({ id }: { id: string }) {
  const props = useCardProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <LayoutSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
      <FillSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
      <BorderSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
      <RadiusSection value={props.borderRadius} onChange={(value) => onPatch({ borderRadius: value })} />
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
    </>
  );
}

function ButtonRootInspector({ id }: { id: string }) {
  const props = useButtonProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <FillSection props={props} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />
      <BorderSection props={props} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />
      <RadiusSection value={props.borderRadius} onChange={(value) => onPatch({ borderRadius: value })} />
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<ButtonProps>) => void} />
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
    </>
  );
}

function TableRootInspector({ id }: { id: string }) {
  const props = useTableProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <Section title="Table">
        <FieldRow label="Header row">
          <ToggleField value={props.showHeader} onChange={(value) => onPatch({ showHeader: value })} />
        </FieldRow>
        <FieldRow label="Zebra">
          <ToggleField value={props.zebra} onChange={(value) => onPatch({ zebra: value })} />
        </FieldRow>
      </Section>
      <Section title="Fills">
        <FieldRow label="Header">
          <ColorField value={props.headerFill} onChange={(value) => onPatch({ headerFill: value })} />
        </FieldRow>
        <FieldRow label="Row">
          <ColorField value={props.rowFill} onChange={(value) => onPatch({ rowFill: value })} />
        </FieldRow>
        <FieldRow label="Alt row">
          <ColorField value={props.rowFillAlt} onChange={(value) => onPatch({ rowFillAlt: value })} />
        </FieldRow>
      </Section>
      <BorderSection props={props} onPatch={onPatch as (patch: Partial<TableProps>) => void} />
      <RadiusSection
        value={props.borderRadius}
        onChange={(value) => onPatch({ borderRadius: value })}
        max={32}
      />
      <Section title="Layout">
        <FieldRow label="Cell pad">
          <NumberField
            value={props.cellPadding}
            onChange={(value) => onPatch({ cellPadding: value })}
            min={0}
            max={32}
            unit="px"
          />
        </FieldRow>
      </Section>
      <TextStyleOverviewSection
        id={id}
        items={[
          { label: 'Header text', layerId: 'columns', scope: 'table-header', note: 'Column labels' },
          { label: 'Body text', layerId: 'rows', scope: 'table-body', note: 'Rows and cells' },
        ]}
      />
    </>
  );
}

function LandingRootInspector({ id }: { id: string }) {
  const props = useLandingProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <Section title="Colors">
        <FieldRow label="Page">
          <ColorField value={props.pageFill} onChange={(value) => onPatch({ pageFill: value })} />
        </FieldRow>
        <FieldRow label="Hero">
          <ColorField value={props.heroFill} onChange={(value) => onPatch({ heroFill: value })} />
        </FieldRow>
        <FieldRow label="Features">
          <ColorField value={props.featuresFill} onChange={(value) => onPatch({ featuresFill: value })} />
        </FieldRow>
        <FieldRow label="Accent">
          <ColorField value={props.accentColor} onChange={(value) => onPatch({ accentColor: value })} />
        </FieldRow>
      </Section>
      <RadiusSection
        value={props.borderRadius}
        onChange={(value) => onPatch({ borderRadius: value })}
        max={48}
      />
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<LandingProps>) => void} />
      <TextStyleOverviewSection
        id={id}
        items={[
          {
            label: 'Hero title',
            layerId: 'hero-title',
            scope: 'landing-heading',
            note: 'Shared heading style',
          },
          { label: 'Hero body', layerId: 'hero-body', scope: 'landing-body', note: 'Shared body style' },
          {
            label: 'Features title',
            layerId: 'features-title',
            scope: 'landing-heading',
            note: 'Shared heading style',
          },
          {
            label: 'CTA label',
            layerId: 'cta-label',
            scope: 'landing-heading',
            note: 'Shared heading style',
          },
        ]}
      />
    </>
  );
}

function TextStyleOverviewSection({ id, items }: { id: string; items: readonly TextStyleOverviewItem[] }) {
  return (
    <Section title="Text styles">
      <div className="sidebar-style-overview-list">
        {items.map((item) => (
          <TextStyleOverviewRow key={item.layerId} id={id} item={item} />
        ))}
      </div>
    </Section>
  );
}

function TextStyleOverviewRow({ id, item }: { id: string; item: TextStyleOverviewItem }) {
  const typography = useTypographyScope(id, item.scope);
  if (!typography) return null;

  const summary = [
    getFontLabel(typography.values.font),
    `${typography.values.fontSize}px`,
    weightLabel(typography.values.fontWeight),
    typography.values.italic ? 'Italic' : null,
    typography.color?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      className="sidebar-style-overview-button"
      onClick={() => useEditorStore.getState().selectLayer(layerSelection(id, item.layerId))}
    >
      <span className="sidebar-style-overview-header">
        <span className="sidebar-style-overview-label">{item.label}</span>
        <span className="sidebar-style-overview-action">Edit</span>
      </span>
      <span className="sidebar-style-overview-summary">{summary}</span>
      {item.note ? <span className="sidebar-style-overview-note">{item.note}</span> : null}
    </button>
  );
}

function weightLabel(weight: number): string {
  switch (weight) {
    case 400:
      return 'Regular';
    case 500:
      return 'Medium';
    case 600:
      return 'Semibold';
    case 700:
      return 'Bold';
    default:
      return String(weight);
  }
}
