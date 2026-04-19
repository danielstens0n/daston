import type { FontWeight } from '../../state/types.ts';

type Props = {
  value: FontWeight;
  onChange: (value: FontWeight) => void;
  ariaLabel?: string;
};

const OPTIONS: { value: FontWeight; label: string }[] = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
];

export function WeightField({ value, onChange, ariaLabel }: Props) {
  return (
    <div className="sidebar-weight-field">
      <select
        className="sidebar-weight-field-select"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => {
          const n = Number(event.target.value);
          const hit = OPTIONS.find((o) => o.value === n);
          if (hit) onChange(hit.value);
        }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
