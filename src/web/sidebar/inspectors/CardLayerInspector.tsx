import { useCardProps, useTypographyScope, useUpdateProps } from '../../state/editor.ts';
import type { CardLayerId } from '../../state/registry/data.ts';
import type { CardProps } from '../../state/types.ts';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { LayoutSection } from '../sections/LayoutSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { TextLayerFields } from '../sections/TextLayerFields.tsx';

type Props = {
  id: string;
  layerId: CardLayerId;
};

export function CardLayerInspector({ id, layerId }: Props) {
  switch (layerId) {
    case 'surface':
      return <CardSurfacePanel id={id} />;
    case 'title':
      return <CardTitlePanel id={id} />;
    case 'body':
      return <CardBodyPanel id={id} />;
    default: {
      const _exhaustive: never = layerId;
      return _exhaustive;
    }
  }
}

function CardSurfacePanel({ id }: { id: string }) {
  const props = useCardProps(id);
  const onPatch = useUpdateProps(id);
  if (!props) return null;
  return (
    <>
      <LayoutSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
      <FillSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
      <BorderSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
      <ShadowSection props={props} onPatch={onPatch as (patch: Partial<CardProps>) => void} />
    </>
  );
}

function CardTitlePanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'card-title');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      color={t.color}
      onColorChange={t.onColorChange}
      fontAriaLabel="Card title font"
      weightAriaLabel="Card title weight"
    />
  );
}

function CardBodyPanel({ id }: { id: string }) {
  const t = useTypographyScope(id, 'card-body');
  if (!t) return null;
  return (
    <TextLayerFields
      values={t.values}
      onChange={t.onChange}
      color={t.color}
      onColorChange={t.onColorChange}
      fontAriaLabel="Card body font"
      weightAriaLabel="Card body weight"
    />
  );
}
