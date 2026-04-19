// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FontField } from './FontField.tsx';

afterEach(() => {
  cleanup();
});

describe('FontField', () => {
  it('filters and selects a font', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FontField value="inter" onChange={onChange} ariaLabel="Pick font" />);

    await user.click(screen.getByRole('button', { name: 'Pick font' }));
    const search = screen.getByRole('searchbox', { name: 'Search fonts' });
    await user.type(search, 'playfair');

    await user.click(screen.getByRole('option', { name: 'Playfair Display' }));
    expect(onChange).toHaveBeenCalledWith('playfair-display');
  });

  it('closes on Escape', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<FontField value="inter" onChange={onChange} ariaLabel="Pick font" />);

    await user.click(screen.getByRole('button', { name: 'Pick font' }));
    expect(screen.getByRole('searchbox', { name: 'Search fonts' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('searchbox', { name: 'Search fonts' })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
