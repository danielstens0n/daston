type Option<T extends string> = { value: T; label: string; title?: string };

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly Option<T>[];
  ariaLabel: string;
};

export function SegmentedField<T extends string>({ value, onChange, options, ariaLabel }: Props<T>) {
  return (
    <fieldset className="sidebar-segmented-field" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.title}
          className={
            value === opt.value
              ? 'sidebar-segmented-option sidebar-segmented-option-active'
              : 'sidebar-segmented-option'
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
