import type { CSSProperties } from 'react';
import { useShapeProps } from '../state/editor.ts';
import './triangle.css';

export const TRIANGLE_POLYGON_POINTS = '50,2 98,98 2,98';

type Props = {
  id: string;
};

export function Triangle({ id }: Props) {
  const p = useShapeProps(id);
  if (!p) return null;

  const filterStyle: CSSProperties = p.shadowEnabled
    ? { filter: `drop-shadow(0 ${p.shadowOffsetY}px ${p.shadowBlur}px ${p.shadowColor})` }
    : {};

  return (
    <svg
      className="preview-triangle"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={filterStyle}
      aria-hidden
    >
      <title>Triangle</title>
      <polygon
        className="preview-triangle-polygon"
        points={TRIANGLE_POLYGON_POINTS}
        fill={p.fill}
        stroke={p.borderWidth > 0 ? p.borderColor : 'none'}
        strokeWidth={p.borderWidth > 0 ? p.borderWidth : 0}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}
