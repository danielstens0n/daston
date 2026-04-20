// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InstanceIdProvider } from '../canvas/InstanceIdContext.tsx';
import { DEFAULT_CANVAS_BACKGROUND, useEditorStore } from '../state/editor.ts';
import { Button } from './Button.tsx';
import { Card } from './Card.tsx';
import { Landing } from './Landing.tsx';
import { Table } from './Table.tsx';
import { Text } from './Text.tsx';

afterEach(() => {
  cleanup();
});

describe('stock preview bodies', () => {
  beforeEach(() => {
    useEditorStore.setState({
      instances: [],
      selectedId: null,
      selectedTarget: null,
      nextInstanceId: 1,
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

  it('renders button label from the store', () => {
    useEditorStore.getState().addInstance('button', { x: 0, y: 0 });
    const label = useEditorStore.getState().instances.find((i) => i.parentId === 'button-1');
    expect(label?.id).toBe('text-2');
    render(
      <>
        <InstanceIdProvider id="button-1">
          <Button id="button-1" />
        </InstanceIdProvider>
        <InstanceIdProvider id="text-2">
          <Text id="text-2" />
        </InstanceIdProvider>
      </>,
    );
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('renders card copy from the store', () => {
    useEditorStore.getState().addInstance('card', { x: 0, y: 0 });
    useEditorStore.getState().updateProps('text-2', { text: 'Overview' });
    useEditorStore.getState().updateProps('text-3', { text: 'Quarterly metrics and owner notes.' });
    render(
      <>
        <InstanceIdProvider id="card-1">
          <Card id="card-1" />
        </InstanceIdProvider>
        <InstanceIdProvider id="text-2">
          <Text id="text-2" />
        </InstanceIdProvider>
        <InstanceIdProvider id="text-3">
          <Text id="text-3" />
        </InstanceIdProvider>
      </>,
    );
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
    render(
      <InstanceIdProvider id="table-1">
        <Table id="table-1" />
      </InstanceIdProvider>,
    );
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
    render(
      <InstanceIdProvider id="landing-1">
        <Landing id="landing-1" />
      </InstanceIdProvider>,
    );
    expect(screen.getByText('Build faster')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByText('Highlights')).toBeInTheDocument();
    expect(screen.getByText('Editable previews')).toBeInTheDocument();
  });
});
