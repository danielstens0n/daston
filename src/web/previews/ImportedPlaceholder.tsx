import { useInstance } from '../state/editor.ts';
import './imported-placeholder.css';

type Props = {
  id: string;
};

export function ImportedPlaceholder({ id }: Props) {
  const instance = useInstance(id);
  if (!instance || instance.type !== 'imported') return null;

  return (
    <div className="preview-imported-placeholder">
      <span className="preview-imported-label">Imported</span>
      <span className="preview-imported-id">{instance.definitionId}</span>
    </div>
  );
}
