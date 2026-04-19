// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from '../state/editor.ts';
import { Button } from './Button.tsx';
import { Card } from './Card.tsx';
import { Landing } from './Landing.tsx';
import { Table } from './Table.tsx';

afterEach(() => {
  cleanup();
});

describe('stock preview bodies', () => {
  beforeEach(() => {
    useEditorStore.setState({
      instances: [],
      selectedId: null,
      nextInstanceId: 1,
      clipboard: null,
      lastPasteId: null,
      past: [],
      future: [],
      historyBatch: null,
    });
  });

  it('renders button label from the store', () => {
    useEditorStore.getState().addInstance('button', { x: 0, y: 0 });
    expect(useEditorStore.getState().instances.at(-1)?.id).toBe('button-1');
    render(<Button id="button-1" />);
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('renders card copy from the store', () => {
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    useEditorStore.getState().updateProps('card-1', {
      title: 'Overview',
      body: 'Quarterly metrics and owner notes.',
    });
    render(<Card id="card-1" />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Quarterly metrics and owner notes.')).toBeInTheDocument();
  });

  it('renders table headers and cells from the store', () => {
    useEditorStore.getState().addInstance('table', { x: 0, y: 0 });
    expect(useEditorStore.getState().instances.at(-1)?.id).toBe('table-1');
    useEditorStore.getState().updateProps('table-1', {
      columns: ['Company', 'Owner'],
      rows: [['Acme', 'Ada']],
    });
    render(<Table id="table-1" />);
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('renders landing hero copy from the store', () => {
    useEditorStore.getState().addInstance('landing', { x: 0, y: 0 });
    expect(useEditorStore.getState().instances.at(-1)?.id).toBe('landing-1');
    useEditorStore.getState().updateProps('landing-1', {
      featuresTitle: 'Highlights',
      features: ['Instant theme sync', 'Editable previews', 'Reusable exports'],
    });
    render(<Landing id="landing-1" />);
    expect(screen.getByText('Build faster')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByText('Highlights')).toBeInTheDocument();
    expect(screen.getByText('Editable previews')).toBeInTheDocument();
  });
});
