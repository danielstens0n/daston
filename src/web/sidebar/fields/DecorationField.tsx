import type { TextDecoration } from '../../state/types.ts';

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
  return (
    <fieldset className="sidebar-decoration-field" aria-label="Text decoration">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={
            value === opt.value
              ? 'sidebar-decoration-option sidebar-decoration-option-active'
              : 'sidebar-decoration-option'
          }
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </fieldset>
  );
}
