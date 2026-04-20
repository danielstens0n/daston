// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { ThemeConfig } from '../../../shared/types.ts';
import { getResolvedThemeConfig, setResolvedThemeConfig } from '../../lib/theme-defaults-context.ts';
import {
  baseCardProps,
  createDefaultCardInstances,
  DEFAULT_SEED_CARD_INSTANCE_IDS,
} from './instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from './store.ts';

describe('applyInitialThemeFromServer', () => {
  beforeEach(() => {
    setResolvedThemeConfig(null);
    useEditorStore.setState({
      instances: createDefaultCardInstances(null),
      selectedId: null,
      selectedTarget: null,
      nextInstanceId: 4,
      clipboard: null,
      lastPasteId: null,
      past: [],
      future: [],
      historyBatch: null,
      canvasBackgroundColor: DEFAULT_CANVAS_BACKGROUND,
      activeTool: 'select',
      pendingTextEditInstanceId: null,
    });
  });

  it('updates pristine default card with theme colors', () => {
    const theme: ThemeConfig = {
      version: 1,
      fonts: { heading: 'Inter', body: 'Inter' },
      colors: { background: '#eeeeee', foreground: '#222222', card: '#ffffff' },
    };
    useEditorStore.getState().applyInitialThemeFromServer(theme);
    const card = useEditorStore
      .getState()
      .instances.find((i) => i.id === DEFAULT_SEED_CARD_INSTANCE_IDS.root);
    const title = useEditorStore
      .getState()
      .instances.find((i) => i.id === DEFAULT_SEED_CARD_INSTANCE_IDS.titleText);
    expect(card?.type).toBe('card');
    if (card?.type === 'card') {
      expect(card.props.fill).toBe('#ffffff');
    }
    expect(title?.type).toBe('text');
    if (title?.type === 'text') {
      expect(title.props.textColor).toBe('#222222');
    }
    expect(getResolvedThemeConfig()).toEqual(theme);
  });

  it('does not overwrite instances when not pristine', () => {
    const instances = createDefaultCardInstances(null);
    const titleId = DEFAULT_SEED_CARD_INSTANCE_IDS.titleText;
    const patched = instances.map((inst) =>
      inst.id === titleId && inst.type === 'text'
        ? { ...inst, props: { ...inst.props, text: 'Edited' } }
        : inst,
    );
    useEditorStore.setState({ instances: patched });
    const theme: ThemeConfig = {
      version: 1,
      fonts: { heading: 'Inter', body: 'Inter' },
      colors: { primary: '#ff0000' },
    };
    useEditorStore.getState().applyInitialThemeFromServer(theme);
    const title = useEditorStore.getState().instances.find((i) => i.id === titleId);
    expect(title?.type).toBe('text');
    if (title?.type === 'text') {
      expect(title.props.text).toBe('Edited');
    }
    const card = useEditorStore
      .getState()
      .instances.find((i) => i.id === DEFAULT_SEED_CARD_INSTANCE_IDS.root);
    expect(card?.type).toBe('card');
    if (card?.type === 'card') {
      expect(card.props).toEqual(baseCardProps());
    }
    expect(getResolvedThemeConfig()).toEqual(theme);
  });
});
