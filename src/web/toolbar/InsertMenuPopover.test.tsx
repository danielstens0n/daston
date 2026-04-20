// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InsertMenuPopover } from './InsertMenuPopover.tsx';

afterEach(() => {
  cleanup();
});

describe('InsertMenuPopover', () => {
  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const anchorRef = { current: document.createElement('button') };
    render(
      <InsertMenuPopover
        open
        anchorRef={anchorRef}
        onClose={onClose}
        onPickShape={vi.fn()}
        onPickComponent={vi.fn()}
        onPickImport={vi.fn()}
      />,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders shape and component tiles', () => {
    const anchorRef = { current: null };
    render(
      <InsertMenuPopover
        open
        anchorRef={anchorRef}
        onClose={vi.fn()}
        onPickShape={vi.fn()}
        onPickComponent={vi.fn()}
        onPickImport={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Insert' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rectangle' })).toBeInTheDocument();
  });
});
