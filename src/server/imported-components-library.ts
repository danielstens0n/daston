import { CHROME_SELECTION_HEX } from '../shared/chrome-colors.ts';
import type { ImportedLibraryComponent, ImportedLibraryComponentId } from '../shared/types.ts';

type LibraryComponentTemplate = ImportedLibraryComponent & {
  sourceCode: string;
};

const STATS_CARD_SOURCE = `export default function StatsCard() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        padding: 24,
        borderRadius: 18,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.12)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#0f172a',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
        Monthly recurring revenue
      </div>
      <div style={{ marginTop: 14, fontSize: 36, fontWeight: 700 }}>$48,240</div>
      <div style={{ marginTop: 10, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: 999,
            background: '#dcfce7',
            color: '#166534',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          +12.4%
        </span>
        <span style={{ fontSize: 13, color: '#475569' }}>Compared to last month</span>
      </div>
    </div>
  );
}
`;

const PRICING_PANEL_SOURCE = `export default function PricingPanel() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        padding: 24,
        borderRadius: 20,
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: '#93c5fd', fontWeight: 600 }}>Pro plan</div>
        <div style={{ marginTop: 14, fontSize: 34, fontWeight: 700 }}>$29<span style={{ fontSize: 16 }}>/mo</span></div>
        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: '#cbd5e1' }}>
          Unlimited projects, team workspaces, and shareable review links for every design.
        </p>
      </div>
      <div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18, fontSize: 13, color: '#e2e8f0' }}>
          <span>Unlimited components</span>
          <span>Instant preview rendering</span>
          <span>Local project storage</span>
        </div>
        <button
          type="button"
          style={{
            width: '100%',
            border: 'none',
            borderRadius: 12,
            padding: '12px 16px',
            background: '${CHROME_SELECTION_HEX}',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Start free trial
        </button>
      </div>
    </div>
  );
}
`;

const LIBRARY_COMPONENTS: readonly LibraryComponentTemplate[] = [
  {
    id: 'stats-card',
    label: 'Stats card',
    description: 'A compact KPI card inspired by shadcn dashboard blocks.',
    sourceCode: STATS_CARD_SOURCE,
  },
  {
    id: 'pricing-panel',
    label: 'Pricing panel',
    description: 'A dark pricing surface with plan details and a full-width CTA.',
    sourceCode: PRICING_PANEL_SOURCE,
  },
];

export const IMPORTED_LIBRARY_COMPONENTS: readonly ImportedLibraryComponent[] = LIBRARY_COMPONENTS.map(
  ({ id, label, description }) => ({ id, label, description }),
);

export function getImportedLibraryComponent(
  id: ImportedLibraryComponentId,
): LibraryComponentTemplate | undefined {
  return LIBRARY_COMPONENTS.find((component) => component.id === id);
}
