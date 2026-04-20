// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ThemeConfig } from '../../../../shared/types.ts';
import * as api from '../../../lib/api.ts';
import { setResolvedThemeConfig } from '../../../lib/theme-defaults-context.ts';
import { useEditorStore } from '../../../state/editor/store.ts';
import { ColorPicker } from './ColorPicker.tsx';
import { ColorPickerProvider } from './ColorPickerContext.tsx';

vi.mock('../../../lib/api.ts', () => ({
  patchTheme: vi.fn(),
}));

const anchorRect = new DOMRect(10, 10, 24, 24);

const baseTheme: ThemeConfig = {
  version: 1,
  fonts: { heading: 'Inter', body: 'Inter' },
  colors: { primary: '#ff0000', secondary: '#00ff00' },
};

afterEach(() => {
  cleanup();
  setResolvedThemeConfig(null);
});

beforeEach(() => {
  vi.mocked(api.patchTheme).mockResolvedValue(baseTheme);
  useEditorStore.setState({
    themeConfig: baseTheme,
  });
});

function setup(props: { value: string; onChange: (v: string) => void; onClose?: () => void }) {
  const onClose = props.onClose ?? vi.fn();
  return render(
    <ColorPickerProvider
      session={{
        value: props.value,
        onChange: props.onChange,
        onClose,
        anchorRect,
      }}
    >
      <ColorPicker />
    </ColorPickerProvider>,
  );
}

describe('ColorPicker', () => {
  it('commits valid hex from the hex input', () => {
    const onChange = vi.fn();
    setup({ value: '#000000', onChange });
    const hexInput = screen.getByDisplayValue('#000000');
    fireEvent.change(hexInput, { target: { value: '#112233' } });
    fireEvent.blur(hexInput);
    expect(onChange).toHaveBeenLastCalledWith('#112233');
  });

  it('applies a theme variable when its swatch is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ value: '#000000', onChange });
    await user.click(screen.getByRole('button', { name: /Apply color variable primary/ }));
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('saves current color as a variable via PATCH', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ value: '#aabbcc', onChange });
    await user.click(screen.getByRole('button', { name: 'Save current color as variable' }));
    const nameInput = screen.getByPlaceholderText('name');
    await user.type(nameInput, 'accent');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(api.patchTheme).toHaveBeenCalledWith({
        colors: { accent: '#aabbcc' },
      });
    });
  });
});
