// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../state/editor.ts';
import { layerSelection } from '../state/layers.ts';
import type { CardInstance } from '../state/types.ts';
import { Sidebar } from './Sidebar.tsx';

afterEach(() => {
  cleanup();
});

const card: CardInstance = {
  id: 'card-1',
  type: 'card',
  x: 120,
  y: 120,
  width: 280,
  height: 180,
  props: {
    padding: 20,
    fill: '#ffffff',
    borderColor: '#e4e4e7',
    borderWidth: 1,
    borderRadius: 12,
    shadowEnabled: true,
    shadowColor: '#0000001a',
    shadowBlur: 12,
    shadowOffsetY: 4,
    title: 'Card title',
    body: 'Card body',
    titleColor: '#18181b',
    bodyColor: '#52525b',
    titleFont: 'inter',
    titleFontSize: 16,
    titleFontWeight: 600,
    titleItalic: false,
    titleDecoration: 'none',
    bodyFont: 'inter',
    bodyFontSize: 13,
    bodyFontWeight: 400,
    bodyItalic: false,
    bodyDecoration: 'none',
  },
};

beforeEach(() => {
  useEditorStore.setState({
    instances: [card],
    selectedId: null,
    selectedTarget: null,
    nextInstanceId: 2,
    clipboard: null,
    lastPasteId: null,
    past: [],
    future: [],
    historyBatch: null,
  });
});

describe('Sidebar', () => {
  it('shows the full card inspector when the component root is selected', () => {
    useEditorStore.getState().select('card-1');
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Card title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Card body')).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
  });

  it('focuses title controls when the title layer is selected', () => {
    useEditorStore.getState().selectLayer(layerSelection('card-1', 'title'));
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Card title')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.queryByText('Padding')).not.toBeInTheDocument();
  });

  it('focuses body controls when the body layer is selected', () => {
    useEditorStore.getState().selectLayer(layerSelection('card-1', 'body'));
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Body' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Card body')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
  });

  it('focuses surface controls when the surface layer is selected', () => {
    useEditorStore.getState().selectLayer(layerSelection('card-1', 'surface'));
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Surface' })).toBeInTheDocument();
    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
    expect(screen.getByText('Border')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Card title')).not.toBeInTheDocument();
  });
});
