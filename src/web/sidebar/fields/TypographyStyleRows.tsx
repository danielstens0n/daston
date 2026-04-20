import type { FontWeight, TextDecoration } from '../../state/types.ts';
import { DecorationField } from './DecorationField.tsx';
import { FieldRow } from './FieldRow.tsx';
import { FontField } from './FontField.tsx';
import { INSPECTOR_FONT_SIZE_FIELD } from './inspectorFontSizeProps.ts';
import { NumberField } from './NumberField.tsx';
import { ToggleField } from './ToggleField.tsx';
import { WeightField } from './WeightField.tsx';

type Props = {
  font: string;
  onFontChange: (value: string) => void;
  fontSize: number;
  onFontSizeChange: (value: number) => void;
  fontWeight: FontWeight;
  onFontWeightChange: (value: FontWeight) => void;
  italic: boolean;
  onItalicChange: (value: boolean) => void;
  decoration: TextDecoration;
  onDecorationChange: (value: TextDecoration) => void;
  /** Label for the font row (e.g. "Title", "Header", or "Font"). */
  fontRowLabel: string;
  fontAriaLabel: string;
  weightAriaLabel: string;
};

export function TypographyStyleRows({
  font,
  onFontChange,
  fontSize,
  onFontSizeChange,
  fontWeight,
  onFontWeightChange,
  italic,
  onItalicChange,
  decoration,
  onDecorationChange,
  fontRowLabel,
  fontAriaLabel,
  weightAriaLabel,
}: Props) {
  return (
    <>
      <FieldRow label={fontRowLabel}>
        <FontField value={font} onChange={onFontChange} ariaLabel={fontAriaLabel} />
      </FieldRow>
      <FieldRow label="Size">
        <NumberField value={fontSize} onChange={onFontSizeChange} {...INSPECTOR_FONT_SIZE_FIELD} />
      </FieldRow>
      <FieldRow label="Weight">
        <WeightField value={fontWeight} onChange={onFontWeightChange} ariaLabel={weightAriaLabel} />
      </FieldRow>
      <FieldRow label="Italic">
        <ToggleField value={italic} onChange={onItalicChange} />
      </FieldRow>
      <FieldRow label="Deco">
        <DecorationField value={decoration} onChange={onDecorationChange} />
      </FieldRow>
    </>
  );
}
