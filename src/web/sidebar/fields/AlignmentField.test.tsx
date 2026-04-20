// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlignmentField } from './AlignmentField.tsx';

afterEach(() => {
  cleanup();
});

describe('AlignmentField', () => {
  it('emits horizontal and vertical patches independently', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<AlignmentField value={{ horizontal: 'left', vertical: 'top' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'center' }));
    expect(onChange).toHaveBeenLastCalledWith({ horizontal: 'center' });

    await user.click(screen.getByRole('button', { name: 'bottom' }));
    expect(onChange).toHaveBeenLastCalledWith({ vertical: 'bottom' });
  });
});
