// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField.tsx';

afterEach(() => {
  cleanup();
});

describe('NumberField', () => {
  it('opens preset list on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField value={10} onChange={onChange} min={0} max={64} unit="px" />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
  });

  it('selecting a preset commits the clamped value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField value={10} onChange={onChange} min={0} max={12} />);
    await user.click(screen.getByRole('textbox'));
    await user.click(screen.getByRole('option', { name: '8' }));
    expect(onChange).toHaveBeenCalledWith(8);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('8');
  });

  it('commits finite parses while typing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField value={5} onChange={onChange} min={0} max={10} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '7');
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('clamps on blur', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField value={5} onChange={onChange} min={0} max={10} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '99');
    await user.tab();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('10');
    expect(onChange.mock.calls.some((c) => c[0] === 10)).toBe(true);
  });

  it('closes the menu on Escape without resetting draft when open', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<NumberField value={5} onChange={onChange} min={0} max={10} />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    expect(screen.queryByRole('listbox')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect((input as HTMLInputElement).value).toBe('5');
  });

  it('resets draft on Escape when the menu is closed', async () => {
    const onChange = vi.fn();
    render(<NumberField value={5} onChange={onChange} min={0} max={10} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: '1' } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(1));
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(input.value).toBe('5'));
  });
});
