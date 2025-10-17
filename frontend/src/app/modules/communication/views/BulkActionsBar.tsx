// frontend/src/app/modules/communication/views/BulkActionsBar.tsx
import React from 'react';

interface Props {
  count: number;
  canTogglePublish: boolean;
  onAction(action: 'delete'|'duplicate'|'togglePublish'): void;
}

const BulkActionsBar: React.FC<Props> = ({ count, canTogglePublish, onAction }) => (
  <div className="card-toolbar px-4 py-2 bg-light">
    <span className="me-3">{count} selecionado(s)</span>
    <button className="btn btn-sm btn-light me-2" onClick={()=>onAction('duplicate')}>
      <i className="bi bi-files me-1" /> Duplicar
    </button>
    {canTogglePublish && (
      <button className="btn btn-sm btn-light me-2" onClick={()=>onAction('togglePublish')}>
        <i className={`bi ${canTogglePublish ? 'bi-eye-slash' : 'bi-eye'} me-1`} />
        {canTogglePublish ? 'Despublicar' : 'Publicar'}
      </button>
    )}
    <button className="btn btn-sm btn-danger" onClick={()=>onAction('delete')}>
      <i className="bi bi-trash me-1" /> Excluir
    </button>
  </div>
);

export default BulkActionsBar;