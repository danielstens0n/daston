import { MIN_SIZE } from '../../state/editor/mutations.ts';
import { useEditorStore, useInstanceFrame } from '../../state/editor.ts';
import { FieldRow } from '../fields/FieldRow.tsx';
import { NumberField } from '../fields/NumberField.tsx';
import { Section } from '../fields/Section.tsx';

type Props = {
  id: string;
};

export function FrameInspector({ id }: Props) {
  const frame = useInstanceFrame(id);
  if (!frame) return null;

  const { move, resize } = useEditorStore.getState();

  return (
    <Section title="Frame">
      <FieldRow label="X">
        <NumberField value={frame.x} onChange={(value) => move(id, { x: value, y: frame.y })} unit="px" />
      </FieldRow>
      <FieldRow label="Y">
        <NumberField value={frame.y} onChange={(value) => move(id, { x: frame.x, y: value })} unit="px" />
      </FieldRow>
      <FieldRow label="W">
        <NumberField
          value={frame.width}
          onChange={(value) =>
            resize(id, { x: frame.x, y: frame.y, width: Math.max(MIN_SIZE, value), height: frame.height })
          }
          min={MIN_SIZE}
          unit="px"
        />
      </FieldRow>
      <FieldRow label="H">
        <NumberField
          value={frame.height}
          onChange={(value) =>
            resize(id, { x: frame.x, y: frame.y, width: frame.width, height: Math.max(MIN_SIZE, value) })
          }
          min={MIN_SIZE}
          unit="px"
        />
      </FieldRow>
    </Section>
  );
}
