// frontend/src/app/modules/channels/components/ChannelsList.tsx

import React from 'react';
import { KTSVG } from '../../../../helpers';
import { Channel } from '@shared/types/Channel';

interface Props {
  channels: Channel[];
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel: () => void;
  onEditChannel: (channelId: string) => void;
}

export const ChannelsList: React.FC<Props> = ({
  channels,
  selectedChannelId,
  onChannelSelect,
  onCreateChannel,
  onEditChannel,
}) => {
  return (
    <div className="card card-xl-stretch mb-5 mb-xl-10">
      {/* Header */}
      <div className="card-header border-0 pt-5 d-flex justify-content-between">
        <h3 className="card-title fw-bold fs-3 mb-1">Canais</h3>
        <div className="card-toolbar">
          {selectedChannelId && (
            <button
              className="btn btn-sm btn-light-primary me-2"
              onClick={() => onEditChannel(selectedChannelId)}
            >
              Editar Canal
            </button>
          )}
          <button className="btn btn-sm btn-primary" onClick={onCreateChannel}>
            + Criar Canal
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="card-body pt-5">
        <div className="d-flex flex-column gap-3">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`d-flex align-items-center p-2 border rounded ${
                selectedChannelId === channel.id ? 'border-primary' : 'border-secondary'
              }`}
              style={{ cursor: 'pointer' }}
              onClick={() => onChannelSelect(channel.id)}
            >
              <div className="symbol symbol-50px me-3">
                <span className="symbol-label bg-light-primary d-flex align-items-center justify-content-center">
                  <KTSVG
                    path="../media/icons/duotune/communication/com012.svg"
                    className="svg-icon-3x svg-icon-primary"
                  />
                </span>
              </div>
              <div className="flex-grow-1">
                <span className="text-gray-800 fw-bold fs-6">{channel.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

