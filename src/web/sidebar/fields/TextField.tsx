type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function TextField({ value, onChange, className }: Props) {
  return (
    <input
      type="text"
      className={className ?? 'sidebar-text-field-input'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
