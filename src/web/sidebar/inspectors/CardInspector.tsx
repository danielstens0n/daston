import { useCardProps } from '../../state/editor.ts';
import type { CardProps } from '../../state/types.ts';
import { FieldRow } from '../fields/FieldRow.tsx';
import { Section } from '../fields/Section.tsx';
import { TextField } from '../fields/TextField.tsx';
import { BorderSection } from '../sections/BorderSection.tsx';
import { FillSection } from '../sections/FillSection.tsx';
import { LayoutSection } from '../sections/LayoutSection.tsx';
import { ShadowSection } from '../sections/ShadowSection.tsx';
import { TextColorSection } from '../sections/TextColorSection.tsx';

type Props = {
  id: string;
  onPatch: (patch: Partial<CardProps>) => void;
};

// Per-type glue: compose the shared sections. Props are pulled via the hook
// rather than drilled from the Sidebar, so editing a field only re-renders
// this subtree — not the sidebar header or dispatch.
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
      <LayoutSection props={props} onPatch={onPatch} />
      <FillSection props={props} onPatch={onPatch} />
      <BorderSection props={props} onPatch={onPatch} />
      <ShadowSection props={props} onPatch={onPatch} />
      <TextColorSection props={props} onPatch={onPatch} />
    </>
  );
}
