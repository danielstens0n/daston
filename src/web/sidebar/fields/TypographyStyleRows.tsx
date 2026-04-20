import type { TypographyValues } from '../../state/types.ts';
import { DecorationField } from './DecorationField.tsx';
import { FieldRow } from './FieldRow.tsx';
import { FontField } from './FontField.tsx';
import { INSPECTOR_FONT_SIZE_FIELD } from './inspectorFontSizeProps.ts';
import { NumberField } from './NumberField.tsx';
import { WeightField } from './WeightField.tsx';

type Props = {
  values: TypographyValues;
  onChange: (patch: Partial<TypographyValues>) => void;
  /** Label for the font row (e.g. "Title", "Header", or "Font"). */
  fontRowLabel: string;
  fontAriaLabel: string;
  weightAriaLabel: string;
};

export function TypographyStyleRows({
  values,
  onChange,
  fontRowLabel,
  fontAriaLabel,
  weightAriaLabel,
}: Props) {
  const { font, fontSize, fontWeight, italic, decoration } = values;
  return (
    <>
      <FieldRow label={fontRowLabel}>
        <FontField value={font} onChange={(v) => onChange({ font: v })} ariaLabel={fontAriaLabel} />
      </FieldRow>
      <FieldRow label="Size">
        <NumberField
          value={fontSize}
          onChange={(v) => onChange({ fontSize: v })}
          {...INSPECTOR_FONT_SIZE_FIELD}
        />
      </FieldRow>
      <FieldRow label="Weight">
        <WeightField
          value={fontWeight}
          onChange={(v) => onChange({ fontWeight: v })}
          ariaLabel={weightAriaLabel}
        />
      </FieldRow>
      <FieldRow label="Style">
        <div className="sidebar-typography-format-toolbar">
          <button
            type="button"
            className={
              fontWeight === 700
                ? 'sidebar-format-toggle sidebar-format-toggle-active'
                : 'sidebar-format-toggle'
            }
            aria-pressed={fontWeight === 700}
            aria-label="Bold"
            title="Bold"
            onClick={() => onChange({ fontWeight: fontWeight === 700 ? 400 : 700 })}
          >
            <span className="sidebar-format-toggle-bold">B</span>
          </button>
          <button
            type="button"
            className={
              italic ? 'sidebar-format-toggle sidebar-format-toggle-active' : 'sidebar-format-toggle'
            }
            aria-pressed={italic}
            aria-label="Italic"
            title="Italic"
            onClick={() => onChange({ italic: !italic })}
          >
            <span className="sidebar-format-toggle-italic">I</span>
          </button>
          <DecorationField value={decoration} onChange={(v) => onChange({ decoration: v })} />
        </div>
      </FieldRow>
    </>
  );
}
