// frontend/src/app/modules/groups/views/BulkActionsBar.tsx
import React from 'react'
import { useIntl } from 'react-intl'

interface Props {
  count: number
  onAction(action: 'duplicate' | 'delete'): void
}

const BulkActionsBar: React.FC<Props> = ({ count, onAction }) => {
  const intl = useIntl()
  return (
    <div className="card-toolbar px-4 py-2 bg-light mb-4">
      <span className="me-3">{intl.formatMessage({ id: 'SURVEYS.BULK_ACTIONS.SELECTED', defaultMessage: '{count} selecionado(s)' }, { count })}</span>
      <button
        className="btn btn-sm btn-light me-2"
        onClick={() => onAction('duplicate')}
      >
        <i className="bi bi-files me-1" /> {intl.formatMessage({ id: 'SURVEYS.BULK_ACTIONS.BUTTON.DUPLICATE', defaultMessage: 'Duplicar' })}
      </button>
      <button className="btn btn-sm btn-danger" onClick={() => onAction('delete')}>
        <i className="bi bi-trash me-1" /> {intl.formatMessage({ id: 'SURVEYS.BULK_ACTIONS.BUTTON.DELETE', defaultMessage: 'Excluir' })}
      </button>
    </div>
  )
}

export default BulkActionsBar