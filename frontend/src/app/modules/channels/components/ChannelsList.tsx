import React from 'react'
import clsx from 'clsx'
import { useIntl } from 'react-intl'

export interface Channel {
  id: string
  name: string
}

interface Props {
  channels: Channel[]
  selectedChannelId: string | null
  onChannelSelect: (id: string) => void
  onCreateChannel: () => void
  // 🔥 Adicionada a propriedade opcional para controle de permissão
  canManage?: boolean
}

export const ChannelsList: React.FC<Props> = ({
  channels,
  selectedChannelId,
  onChannelSelect,
  onCreateChannel,
  canManage = true, // Default true para manter compatibilidade se não passado
}) => {
  const intl = useIntl()
  return (
    <div className="card card-flush h-lg-100 border-0 shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center py-5 px-4">
        <h3 className="card-title m-0 fw-bold text-gray-800">{intl.formatMessage({ id: 'CHANNELS.LIST.TITLE' })}</h3>

        {/* 🔥 Só mostra o botão se tiver permissão */}
        {canManage && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onCreateChannel}
          >
            <i className="bi bi-plus-lg me-1"></i> {intl.formatMessage({ id: 'CHANNELS.LIST.BUTTON.NEW' })}
          </button>
        )}
      </div>

      <div className="card-body p-0 bg-white rounded-bottom">
        <div className="list-group list-group-flush">
          {channels.length > 0 ? (
            channels.map(c => (
              <div
                key={c.id}
                onClick={() => onChannelSelect(c.id)}
                style={{ cursor: 'pointer' }}
                className={clsx(
                  'list-group-item list-group-item-action d-flex justify-content-between align-items-center px-4 py-3 transition-all',
                  c.id === selectedChannelId
                    ? 'bg-light-primary text-primary border-start border-3 border-primary'
                    : 'bg-white text-gray-600 hover:bg-light'
                )}
              >
                <span className={clsx("fw-semibold", c.id === selectedChannelId ? "fw-bold" : "")}>
                  {c.name}
                </span>
                {c.id === selectedChannelId && (
                  <i className="ki-outline ki-check text-primary fs-5"></i>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted fs-7">
              {intl.formatMessage({ id: 'CHANNELS.LIST.EMPTY' })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChannelsList