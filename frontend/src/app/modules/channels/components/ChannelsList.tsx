import React from 'react'
import clsx from 'clsx'

export interface Channel {
  id: string
  name: string
}

interface Props {
  channels: Channel[]
  selectedChannelId: string | null
  onChannelSelect: (id: string) => void
  onCreateChannel: () => void
}

export const ChannelsList: React.FC<Props> = ({
  channels,
  selectedChannelId,
  onChannelSelect,
  onCreateChannel,
}) => {
  return (
    <div className="card card-flush h-lg-100">
      <div className="card-header d-flex justify-content-between align-items-center py-5 px-4">
        <h3 className="card-title m-0">Canais</h3>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={onCreateChannel}
        >
          <i className="bi bi-plus-lg me-1"></i> Novo Canal
        </button>
      </div>

      <div className="card-body p-0 bg-white">
        <div className="list-group list-group-flush">
          {channels.map(c => (
            <div
              key={c.id}
              onClick={() => onChannelSelect(c.id)}
              style={{ cursor: 'pointer' }}
              className={clsx(
                'list-group-item list-group-item-action d-flex justify-content-between align-items-center',
                c.id === selectedChannelId ? 'active' : 'bg-white'
              )}
            >
              <span className="fw-semibold">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChannelsList