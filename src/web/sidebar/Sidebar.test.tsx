// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
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

  it('shows the frame inspector plus component overview when the root is selected', () => {
    useEditorStore.getState().select('card-1');
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Frame' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Canvas' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fill' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Border' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shadow' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Text styles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Title.*Inter.*16px/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Body.*Inter.*13px/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Card title')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Card body')).not.toBeInTheDocument();
  });

  it('lets the root overview jump directly to a child text layer', () => {
    useEditorStore.getState().select('card-1');
    render(<Sidebar />);

    fireEvent.click(screen.getByRole('button', { name: /Title.*Inter.*16px/i }));

    expect(useEditorStore.getState().selectedTarget).toEqual(layerSelection('card-1', 'title'));
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.queryByText('Padding')).not.toBeInTheDocument();
  });

  it('shows typography for the title layer without a content field', () => {
    useEditorStore.getState().selectLayer(layerSelection('card-1', 'title'));
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Card title')).not.toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.queryByText('Padding')).not.toBeInTheDocument();
  });

  it('shows typography for the body layer without a content field', () => {
    useEditorStore.getState().selectLayer(layerSelection('card-1', 'body'));
    render(<Sidebar />);
    expect(screen.getByRole('heading', { name: 'Body' })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Card body')).not.toBeInTheDocument();
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
