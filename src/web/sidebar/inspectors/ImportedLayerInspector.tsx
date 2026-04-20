import { useState } from 'react';
import { useInstance } from '../../state/editor.ts';
import { useImportedComponentsStore, useImportedDefinition } from '../../state/registry/imported.ts';

type Props = {
  id: string;
};

export function ImportedLayerInspector({ id }: Props) {
  const instance = useInstance(id);
  const definition = useImportedDefinition(instance?.type === 'imported' ? instance.definitionId : null);
  const [message, setMessage] = useState<string | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  if (!instance || instance.type !== 'imported' || !definition) {
    return (
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Imported component</h3>
        <p className="sidebar-empty">This imported component definition is missing.</p>
      </section>
    );
  }

  const currentDefinition = definition;

  function onRevalidate() {
    setIsRevalidating(true);
    setMessage(null);
    void useImportedComponentsStore
      .getState()
      .revalidateDefinition(currentDefinition.id)
      .then((next) =>
        setMessage(
          next.compileStatus === 'ready'
            ? 'Preview bundle is up to date.'
            : (next.compileError ?? 'Validation failed.'),
        ),
      )
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setIsRevalidating(false));
  }

  return (
    <>
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Imported component</h3>
        <div className="sidebar-field-row">
          <span>Name</span>
          <strong className="sidebar-value">{currentDefinition.label}</strong>
        </div>
        <div className="sidebar-field-row">
          <span>Source</span>
          <strong className="sidebar-value">
            {currentDefinition.sourceKind === 'library' ? 'Curated library' : 'Pasted code'}
          </strong>
        </div>
        <div className="sidebar-field-row">
          <span>Status</span>
          <strong className="sidebar-value" data-status={currentDefinition.compileStatus}>
            {currentDefinition.compileStatus === 'ready' ? 'Ready' : 'Needs attention'}
          </strong>
        </div>
        {currentDefinition.libraryId ? (
          <div className="sidebar-field-row">
            <span>Template</span>
            <strong className="sidebar-value">{currentDefinition.libraryId}</strong>
          </div>
        ) : null}
        <div className="sidebar-action-row">
          <button
            type="button"
            className="sidebar-action-button"
            disabled={isRevalidating}
            onClick={onRevalidate}
          >
            Revalidate
          </button>
        </div>
        {message ? <p className="sidebar-help-text">{message}</p> : null}
        {currentDefinition.compileError ? (
          <p className="sidebar-help-text sidebar-help-text-error">{currentDefinition.compileError}</p>
        ) : null}
      </section>

      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Source</h3>
        <textarea
          className="sidebar-code-preview"
          value={currentDefinition.sourceCode}
          readOnly
          spellCheck={false}
        />
      </section>
    </>
  );
}
