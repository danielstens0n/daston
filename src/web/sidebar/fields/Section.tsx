import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

// Labelled group of field rows. Not collapsible yet; revisit when inspectors
// grow long enough that scanning gets painful.
export function Section({ title, children }: Props) {
  return (
    <section className="sidebar-section">
      <h3 className="sidebar-section-title">{title}</h3>
      {children}
    </section>
  );
}
