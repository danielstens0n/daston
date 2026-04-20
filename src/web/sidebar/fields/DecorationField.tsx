import type { TextDecoration } from '../../state/types.ts';
import { SegmentedField } from './SegmentedField.tsx';

type Props = {
  value: TextDecoration;
  onChange: (value: TextDecoration) => void;
};

const OPTIONS: { value: TextDecoration; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'strikethrough', label: 'Strike' },
];

export function DecorationField({ value, onChange }: Props) {
  return <SegmentedField value={value} onChange={onChange} options={OPTIONS} ariaLabel="Text decoration" />;
}
