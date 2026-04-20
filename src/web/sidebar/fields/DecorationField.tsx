import type { TextDecoration } from '../../state/types.ts';
import { SegmentedField } from './SegmentedField.tsx';

type Props = {
  value: TextDecoration;
  onChange: (value: TextDecoration) => void;
};

const OPTIONS: {
  value: TextDecoration;
  label: string;
  ariaLabel: string;
  labelClassName?: string;
}[] = [
  { value: 'none', label: '—', ariaLabel: 'None' },
  {
    value: 'underline',
    label: 'U',
    ariaLabel: 'Underline',
    labelClassName: 'sidebar-decoration-symbol sidebar-decoration-symbol-underline',
  },
  {
    value: 'strikethrough',
    label: 'S',
    ariaLabel: 'Strikethrough',
    labelClassName: 'sidebar-decoration-symbol sidebar-decoration-symbol-strikethrough',
  },
];

export function DecorationField({ value, onChange }: Props) {
  return <SegmentedField value={value} onChange={onChange} options={OPTIONS} ariaLabel="Text decoration" />;
}
