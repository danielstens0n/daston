// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeightField } from './WeightField.tsx';

afterEach(() => {
  cleanup();
});

describe('WeightField', () => {
  it('emits the selected numeric weight', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<WeightField value={400} onChange={onChange} ariaLabel="Weight" />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Weight' }), '700');
    expect(onChange).toHaveBeenCalledWith(700);
  });
});
