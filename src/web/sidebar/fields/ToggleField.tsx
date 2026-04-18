type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleField({ value, onChange }: Props) {
  return (
    <div className="sidebar-toggle-field">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
    </div>
  );
}
