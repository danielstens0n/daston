// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DecorationField } from './DecorationField.tsx';

afterEach(() => {
  cleanup();
});

describe('DecorationField', () => {
  it('selects underline', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DecorationField value="none" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Underline' }));
    expect(onChange).toHaveBeenCalledWith('underline');
  });
});
