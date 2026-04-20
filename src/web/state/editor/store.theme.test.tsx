// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { ThemeConfig } from '../../../shared/types.ts';
import { getResolvedThemeConfig, setResolvedThemeConfig } from '../../lib/theme-defaults-context.ts';
import { baseCardProps, defaultCard } from './instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from './store.ts';

describe('applyInitialThemeFromServer', () => {
  beforeEach(() => {
    setResolvedThemeConfig(null);
    useEditorStore.setState({
      instances: [defaultCard],
      selectedId: null,
      selectedTarget: null,
      nextInstanceId: 2,
      clipboard: null,
      lastPasteId: null,
      past: [],
      future: [],
      historyBatch: null,
      canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
    });
  });

  it('updates pristine default card with theme colors', () => {
    const theme: ThemeConfig = {
      version: 1,
      fonts: { heading: 'Inter', body: 'Inter' },
      colors: { background: '#eeeeee', foreground: '#222222', card: '#ffffff' },
    };
    useEditorStore.getState().applyInitialThemeFromServer(theme);
    const inst = useEditorStore.getState().instances[0];
    expect(inst?.type).toBe('card');
    if (inst?.type === 'card') {
      expect(inst.props.fill).toBe('#ffffff');
      expect(inst.props.titleColor).toBe('#222222');
    }
    expect(getResolvedThemeConfig()).toEqual(theme);
  });

  it('does not overwrite instances when not pristine', () => {
    useEditorStore.setState({
      instances: [
        {
          ...defaultCard,
          props: { ...baseCardProps(), title: 'Edited' },
        },
      ],
    });
    const theme: ThemeConfig = {
      version: 1,
      fonts: { heading: 'Inter', body: 'Inter' },
      colors: { primary: '#ff0000' },
    };
    useEditorStore.getState().applyInitialThemeFromServer(theme);
    const inst = useEditorStore.getState().instances[0];
    expect(inst?.type).toBe('card');
    if (inst?.type === 'card') {
      expect(inst.props.title).toBe('Edited');
    }
    expect(getResolvedThemeConfig()).toEqual(theme);
  });
});
