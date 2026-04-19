// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextMenuProvider, useContextMenuHost } from './ContextMenu.tsx';
import type { ContextMenuItem } from './types.ts';

afterEach(() => {
  cleanup();
});

function Harness({ items }: { items: ContextMenuItem[] }) {
  const { openMenu } = useContextMenuHost();
  return (
    <div>
      <button
        type="button"
        className="harness-open"
        onClick={() =>
          openMenu({
            clientX: 80,
            clientY: 80,
            items,
          })
        }
      >
        Open
      </button>
      <div className="harness-outside">Outside</div>
    </div>
  );
}

describe('ContextMenu', () => {
  it('runs onSelect and closes after a menu item click', () => {
    const onAlpha = vi.fn();
    render(
      <ContextMenuProvider>
        <Harness
          items={[
            { kind: 'action', label: 'Alpha', onSelect: onAlpha },
            { kind: 'action', label: 'Beta', onSelect: vi.fn() },
          ]}
        />
      </ContextMenuProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Alpha/ }));

    expect(onAlpha).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on Escape', () => {
    render(
      <ContextMenuProvider>
        <Harness items={[{ kind: 'action', label: 'Only', onSelect: vi.fn() }]} />
      </ContextMenuProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on outside pointerdown', () => {
    render(
      <ContextMenuProvider>
        <Harness items={[{ kind: 'action', label: 'Only', onSelect: vi.fn() }]} />
      </ContextMenuProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.pointerDown(screen.getByText('Outside'));

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('does not run onSelect for disabled items', () => {
    const onBeta = vi.fn();
    render(
      <ContextMenuProvider>
        <Harness
          items={[
            { kind: 'action', label: 'Alpha', disabled: true, onSelect: vi.fn() },
            { kind: 'action', label: 'Beta', onSelect: onBeta },
          ]}
        />
      </ContextMenuProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Alpha/ }));

    expect(onBeta).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
