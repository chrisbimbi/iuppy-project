// frontend/src/app/modules/groups/views/BulkActionsBar.tsx
import React from 'react'

interface Props {
  count: number
  onAction(action: 'duplicate' | 'delete'): void
}

const BulkActionsBar: React.FC<Props> = ({ count, onAction }) => (
  <div className="card-toolbar px-4 py-2 bg-light mb-4">
    <span className="me-3">{count} selecionado(s)</span>
    <button
      className="btn btn-sm btn-light me-2"
      onClick={() => onAction('duplicate')}
    >
      <i className="bi bi-files me-1" /> Duplicar
    </button>
    <button className="btn btn-sm btn-danger" onClick={() => onAction('delete')}>
      <i className="bi bi-trash me-1" /> Excluir
    </button>
  </div>
)

export default BulkActionsBar