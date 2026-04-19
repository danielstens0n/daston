import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { ImportedLibraryComponentId } from '../../shared/types.ts';
import { useImportedComponentsStore, useImportedLibrary } from '../state/imported-components.ts';

type TabId = 'library' | 'paste';

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (definitionId: string) => void;
};

const DEFAULT_SOURCE = `export default function CustomComponent() {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        padding: 24,
        borderRadius: 18,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h2 style={{ margin: 0, fontSize: 22 }}>Custom component</h2>
      <p style={{ margin: '12px 0 0', color: '#475569', lineHeight: 1.6 }}>
        Replace this with your own React component and default export it.
      </p>
    </div>
  );
}
`;

export function ImportComponentDialog({ open, onClose, onImport }: Props) {
  const [tab, setTab] = useState<TabId>('library');
  const [label, setLabel] = useState('Custom component');
  const [sourceCode, setSourceCode] = useState(DEFAULT_SOURCE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const library = useImportedLibrary();

  const canSubmitPaste = useMemo(
    () => label.trim().length > 0 && sourceCode.trim().length > 0 && !isSubmitting,
    [isSubmitting, label, sourceCode],
  );

  useEffect(() => {
    if (!open) return;
    void useImportedComponentsStore
      .getState()
      .load()
      .then(() => setError(null))
      .catch((nextError: Error) => setError(nextError.message));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  function importLibrary(libraryId: ImportedLibraryComponentId) {
    setIsSubmitting(true);
    setError(null);
    void useImportedComponentsStore
      .getState()
      .createDefinition({ sourceKind: 'library', libraryId })
      .then((definition) => {
        onImport(definition.id);
        onClose();
      })
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setIsSubmitting(false));
  }

  function onSubmitPaste(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitPaste) return;
    setIsSubmitting(true);
    setError(null);
    void useImportedComponentsStore
      .getState()
      .createDefinition({
        sourceKind: 'paste',
        label: label.trim(),
        sourceCode,
      })
      .then((definition) => {
        onImport(definition.id);
        onClose();
      })
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setIsSubmitting(false));
  }

  return (
    <div className="import-dialog-layer" data-canvas-shortcuts-block>
      <button
        type="button"
        className="import-dialog-backdrop"
        aria-label="Close import dialog"
        onClick={onClose}
      />
      <div className="import-dialog" role="dialog" aria-modal="true" aria-label="Import component">
        <header className="import-dialog-header">
          <div>
            <h2 className="import-dialog-title">Import component</h2>
            <p className="import-dialog-subtitle">Bring curated blocks or pasted React onto the canvas.</p>
          </div>
          <button type="button" className="import-dialog-close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="import-dialog-tabs" role="tablist" aria-label="Import source">
          <button
            type="button"
            className="import-dialog-tab"
            data-active={tab === 'library' || undefined}
            onClick={() => setTab('library')}
          >
            Curated library
          </button>
          <button
            type="button"
            className="import-dialog-tab"
            data-active={tab === 'paste' || undefined}
            onClick={() => setTab('paste')}
          >
            Paste code
          </button>
        </div>

        {error ? <div className="import-dialog-error">{error}</div> : null}

        {tab === 'library' ? (
          <div className="import-dialog-library">
            {library.map((component) => (
              <button
                key={component.id}
                type="button"
                className="import-dialog-library-item"
                disabled={isSubmitting}
                onClick={() => importLibrary(component.id)}
              >
                <span className="import-dialog-library-label">{component.label}</span>
                <span className="import-dialog-library-description">{component.description}</span>
              </button>
            ))}
          </div>
        ) : (
          <form className="import-dialog-form" onSubmit={onSubmitPaste}>
            <label className="import-dialog-label">
              <span>Name</span>
              <input value={label} onChange={(event) => setLabel(event.target.value)} />
            </label>
            <label className="import-dialog-label">
              <span>Component source</span>
              <textarea
                value={sourceCode}
                onChange={(event) => setSourceCode(event.target.value)}
                spellCheck={false}
              />
            </label>
            <div className="import-dialog-actions">
              <button type="button" className="import-dialog-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="import-dialog-primary" disabled={!canSubmitPaste}>
                Import to canvas
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
