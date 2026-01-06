// frontend/src/app/modules/communication/views/BulkActionsBar.tsx
import React from 'react';
import { useIntl } from 'react-intl';

interface Props {
  count: number;
  canTogglePublish: boolean;
  onAction(action: 'delete' | 'duplicate' | 'togglePublish'): void;
}

const BulkActionsBar: React.FC<Props> = ({ count, canTogglePublish, onAction }) => {
  const intl = useIntl();
  return (
    <div className="card-toolbar px-4 py-2 bg-light">
      <span className="me-3">{intl.formatMessage({ id: 'GROUPS.BULK_ACTIONS.SELECTED' }, { count })}</span>
      <button className="btn btn-sm btn-light me-2" onClick={() => onAction('duplicate')}>
        <i className="bi bi-files me-1" /> {intl.formatMessage({ id: 'GROUPS.BULK_ACTIONS.DUPLICATE' })}
      </button>
      {canTogglePublish && (
        <button className="btn btn-sm btn-light me-2" onClick={() => onAction('togglePublish')}>
          <i className={`bi ${canTogglePublish ? 'bi-eye-slash' : 'bi-eye'} me-1`} />
          {canTogglePublish ? intl.formatMessage({ id: 'GROUPS.BULK_ACTIONS.UNPUBLISH' }) : intl.formatMessage({ id: 'GROUPS.BULK_ACTIONS.PUBLISH' })}
        </button>
      )}
      <button className="btn btn-sm btn-danger" onClick={() => onAction('delete')}>
        <i className="bi bi-trash me-1" /> {intl.formatMessage({ id: 'GROUPS.BULK_ACTIONS.DELETE' })}
      </button>
    </div>
  );
};

export default BulkActionsBar;