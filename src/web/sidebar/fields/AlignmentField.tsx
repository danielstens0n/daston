import type { TextAlign, TextVerticalAlign } from '../../state/types.ts';

export type AlignmentValue = { horizontal: TextAlign; vertical: TextVerticalAlign };

type Props = {
  value: AlignmentValue;
  onChange: (patch: Partial<AlignmentValue>) => void;
};

const H: readonly TextAlign[] = ['left', 'center', 'right'];
const V: readonly TextVerticalAlign[] = ['top', 'middle', 'bottom'];

function IconH({ align }: { align: TextAlign }) {
  const bars =
    align === 'left' ? (
      <>
        <rect x="2" y="5" width="10" height="2" rx="0.5" fill="currentColor" />
        <rect x="2" y="9" width="6" height="2" rx="0.5" fill="currentColor" opacity="0.45" />
        <rect x="2" y="13" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.45" />
      </>
    ) : align === 'center' ? (
      <>
        <rect x="4" y="5" width="8" height="2" rx="0.5" fill="currentColor" />
        <rect x="3" y="9" width="10" height="2" rx="0.5" fill="currentColor" opacity="0.45" />
        <rect x="4" y="13" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.45" />
      </>
    ) : (
      <>
        <rect x="4" y="5" width="10" height="2" rx="0.5" fill="currentColor" />
        <rect x="6" y="9" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.45" />
        <rect x="4" y="13" width="10" height="2" rx="0.5" fill="currentColor" opacity="0.45" />
      </>
    );
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative; parent button has aria-label
    <svg className="sidebar-alignment-icon" viewBox="0 0 18 18" aria-hidden>
      {bars}
    </svg>
  );
}

function IconV({ align }: { align: TextVerticalAlign }) {
  const bars =
    align === 'top' ? (
      <>
        <rect x="5" y="2" width="2" height="10" rx="0.5" fill="currentColor" />
        <rect x="9" y="2" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.45" />
        <rect x="13" y="2" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.45" />
      </>
    ) : align === 'middle' ? (
      <>
        <rect x="5" y="4" width="2" height="8" rx="0.5" fill="currentColor" />
        <rect x="9" y="3" width="2" height="10" rx="0.5" fill="currentColor" opacity="0.45" />
        <rect x="13" y="4" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.45" />
      </>
    ) : (
      <>
        <rect x="5" y="4" width="2" height="10" rx="0.5" fill="currentColor" />
        <rect x="9" y="6" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.45" />
        <rect x="13" y="4" width="2" height="10" rx="0.5" fill="currentColor" opacity="0.45" />
      </>
    );
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: decorative; parent button has aria-label
    <svg className="sidebar-alignment-icon" viewBox="0 0 18 18" aria-hidden>
      {bars}
    </svg>
  );
}

export function AlignmentField({ value, onChange }: Props) {
  return (
    <div className="sidebar-alignment-field">
      <fieldset className="sidebar-alignment-row" aria-label="Horizontal text alignment">
        {H.map((h) => (
          <button
            key={h}
            type="button"
            className="sidebar-alignment-button"
            data-active={value.horizontal === h || undefined}
            aria-pressed={value.horizontal === h}
            aria-label={h}
            onClick={() => onChange({ horizontal: h })}
          >
            <IconH align={h} />
          </button>
        ))}
      </fieldset>
      <fieldset className="sidebar-alignment-row" aria-label="Vertical text alignment">
        {V.map((v) => (
          <button
            key={v}
            type="button"
            className="sidebar-alignment-button"
            data-active={value.vertical === v || undefined}
            aria-pressed={value.vertical === v}
            aria-label={v}
            onClick={() => onChange({ vertical: v })}
          >
            <IconV align={v} />
          </button>
        ))}
      </fieldset>
    </div>
  );
}
