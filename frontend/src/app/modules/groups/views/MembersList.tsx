import React from 'react'
import { useIntl } from 'react-intl'
import clsx from 'clsx'
import { User } from '@shared/types'

interface Props {
  members: User[]
  loading: boolean
  error: string | null
  onRemove(userId: string): void
}

const MembersList: React.FC<Props> = ({ members, loading, error, onRemove }) => {
  const intl = useIntl()
  if (loading) return <div>{intl.formatMessage({ id: 'GROUPS.MEMBERS.LOADING', defaultMessage: 'Loading members...' })}</div>
  if (error) return <div className="text-danger">{intl.formatMessage({ id: 'GROUPS.MEMBERS.ERROR', defaultMessage: 'Error loading members' })}</div>
  if (members.length === 0) return <div>{intl.formatMessage({ id: 'GROUPS.MEMBERS.EMPTY', defaultMessage: 'No members.' })}</div>

  return (
    <div className="row g-3">
      {members.map(u => (
        <div key={u.id} className="col-6 col-md-4 col-lg-3">
          <div className="card position-relative p-2 text-center">
            <button
              type="button"
              className="btn btn-sm btn-icon position-absolute top-0 end-0"
              onClick={() => onRemove(u.id)}
            >
              <i className="bi bi-x fs-4"></i>
            </button>
            <img
              src={u.avatarUrl || '/media/avatars/blank.png'}
              loading="lazy"
              draggable="false"
              className="rounded-circle mb-2"
              width={48}
              height={48}
              alt={u.name}
            />
            <div className="fw-semibold">{u.name}</div>
            <small className="d-block text-muted">{u.spaceId || '—'}</small>
            <small className="d-block text-muted">{u.role}</small>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MembersList