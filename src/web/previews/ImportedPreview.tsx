import { useInstance } from '../state/editor.ts';
import { useImportedDefinition } from '../state/imported-components.ts';
import './imported-preview.css';

type Props = {
  id: string;
};

export function ImportedPreview({ id }: Props) {
  const instance = useInstance(id);
  const definition = useImportedDefinition(instance?.type === 'imported' ? instance.definitionId : null);
  if (!instance || instance.type !== 'imported') return null;

  if (!definition) {
    return (
      <div className="preview-imported preview-imported-missing">
        <div className="preview-imported-label">Missing imported component</div>
      </div>
    );
  }

  return (
    <div className="preview-imported">
      <iframe
        className="preview-imported-frame"
        title={definition.label}
        sandbox="allow-scripts"
        src={`/api/imported-components/${encodeURIComponent(definition.id)}/preview`}
      />
      <div className="preview-imported-chip">
        <span>{definition.label}</span>
        <span>{definition.sourceKind === 'library' ? 'Library' : 'Code'}</span>
      </div>
    </div>
  );
}
