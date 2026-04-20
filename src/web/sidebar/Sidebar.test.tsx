// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultCardInstances,
  DEFAULT_SEED_CARD_INSTANCE_IDS,
} from '../state/editor/instance-defaults.ts';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
import { instanceSelection } from '../state/layers.ts';
import { Sidebar } from './Sidebar.tsx';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
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
  });
});

describe('Sidebar', () => {
  it('shows canvas controls only when no element is selected', () => {
    render(<Sidebar />);
    expect(screen.getAllByRole('heading', { name: 'Canvas' })).toHaveLength(2);
    expect(screen.getByText('Edit canvas background')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue(DEFAULT_CANVAS_BACKGROUND)).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Frame' })).not.toBeInTheDocument();
  });

  it('shows the frame inspector for the card root without text-style shortcuts', () => {
    useEditorStore.getState().select(DEFAULT_SEED_CARD_INSTANCE_IDS.root);
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Frame' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Canvas' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fill' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Border' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shadow' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Text styles' })).not.toBeInTheDocument();
  });

  it('shows the text primitive inspector when the title child instance is selected', () => {
    useEditorStore.getState().select(DEFAULT_SEED_CARD_INSTANCE_IDS.titleText);
    render(<Sidebar />);
    expect(
      screen
        .getAllByRole('heading', { name: 'Text' })
        .some((el) => el.className.includes('sidebar-section-title')),
    ).toBe(true);
    expect(screen.getByRole('heading', { name: 'Typography' })).toBeInTheDocument();
    expect(screen.getByText(/text · text-2/)).toBeInTheDocument();
  });

  it('selecting the title row uses instance selection', () => {
    useEditorStore.getState().select(DEFAULT_SEED_CARD_INSTANCE_IDS.titleText);
    expect(useEditorStore.getState().selectedTarget).toEqual(
      instanceSelection(DEFAULT_SEED_CARD_INSTANCE_IDS.titleText),
    );
  });
});
