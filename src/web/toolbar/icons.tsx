import type { SVGProps } from 'react';

// Minimal 20×20 inline icons. Kept as pure components so they don't pull in
// an icon library, and the same set can be reused across the web UI.
//
// Each svg has a <title> for biome's noSvgWithoutTitle rule; the wrapping
// <button> in CanvasToolbar carries the authoritative aria-label.

const base: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function CardIcon() {
  return (
    <svg {...base}>
      <title>Card</title>
      <rect x="3" y="4" width="14" height="12" rx="2" />
      <line x1="6" y1="8" x2="12" y2="8" />
      <line x1="6" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function ButtonIcon() {
  return (
    <svg {...base}>
      <title>Button</title>
      <rect x="3" y="7" width="14" height="6" rx="3" />
      <line x1="7" y1="10" x2="13" y2="10" />
    </svg>
  );
}

export function TableIcon() {
  return (
    <svg {...base}>
      <title>Table</title>
      <rect x="3" y="4" width="14" height="12" rx="1.5" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="3" y1="12" x2="17" y2="12" />
      <line x1="10" y1="4" x2="10" y2="16" />
    </svg>
  );
}

export function LandingIcon() {
  return (
    <svg {...base}>
      <title>Landing page</title>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <line x1="3" y1="7" x2="17" y2="7" />
      <rect x="5.5" y="9.5" width="4" height="5" rx="0.5" />
      <line x1="11" y1="10" x2="14.5" y2="10" />
      <line x1="11" y1="12.5" x2="14.5" y2="12.5" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...base}>
      <title>Insert</title>
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </svg>
  );
}

export function RectangleIcon() {
  return (
    <svg {...base}>
      <title>Rectangle</title>
      <rect x="4" y="5" width="12" height="11" rx="1" />
    </svg>
  );
}

export function EllipseIcon() {
  return (
    <svg {...base}>
      <title>Ellipse</title>
      <ellipse cx="10" cy="10" rx="7" ry="5" />
    </svg>
  );
}

export function TriangleIcon() {
  return (
    <svg {...base}>
      <title>Triangle</title>
      <path d="M10 4 L17 16 H3 Z" />
    </svg>
  );
}

export function TextIcon() {
  return (
    <svg {...base}>
      <title>Text</title>
      <path d="M6 4 h8 M10 4 v12 M7 16 h6" />
    </svg>
  );
}

export function SidebarToggleIcon({ collapsed, title }: { collapsed: boolean; title: string }) {
  return (
    <svg {...base}>
      <title>{title}</title>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <line x1="7" y1="3" x2="7" y2="17" />
      {collapsed ? <polyline points="10,7 13,10 10,13" /> : <polyline points="13,7 10,10 13,13" />}
    </svg>
  );
}
