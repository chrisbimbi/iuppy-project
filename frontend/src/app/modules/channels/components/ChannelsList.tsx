import React from 'react'
import clsx from 'clsx'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'


export interface Channel {
  id: string
  name: string
}

interface Props {
  channels: Channel[]
  selectedChannelId: string | null
  onChannelSelect: (id: string) => void
  onChannelReorder: (newOrder: string[]) => void
  onCreateChannel: () => void
  onEditChannel: (id: string) => void
  onCreatePost: (channelId: string) => void
}

export const ChannelsList: React.FC<Props> = ({
  channels,
  selectedChannelId,
  onChannelSelect,
  onChannelReorder,
  onCreateChannel,
  onEditChannel,
  onCreatePost,
}) => {
  const selected = channels.find(c => c.id === selectedChannelId)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(channels)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    onChannelReorder(items.map(i => i.id))
  }

  return (
    <div className="card card-flush h-lg-100">
      <div className="card-header align-items-center py-5">
        <h3 className="card-title m-0">Canais</h3>
      </div>

      <div className="card-body py-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="channels">
            {prov => (
              <div
                {...prov.droppableProps}
                ref={prov.innerRef}
                className="list-group list-group-flush"
              >
                {channels.map((c, idx) => (
                  <Draggable key={c.id} draggableId={c.id} index={idx}>
                    {prov2 => (
                      <button
                        ref={prov2.innerRef}
                        {...prov2.draggableProps}
                        {...prov2.dragHandleProps}
                        className={clsx(
                          'list-group-item list-group-item-action d-flex align-items-center py-3',
                          c.id === selectedChannelId && 'active'
                        )}
                        onClick={() => onChannelSelect(c.id)}
                      >
                        <i className="bi bi-list fs-4 me-3"></i>
                        <span className="flex-grow-1">{c.name}</span>
                      </button>
                    )}
                  </Draggable>
                ))}
                {prov.placeholder}

                <button
                  type="button"
                  className="list-group-item list-group-item-action text-primary d-flex align-items-center py-3 mt-2"
                  onClick={onCreateChannel}
                >
                  <span className="badge border border-primary text-primary rounded-circle me-3">
                    <i className="bi bi-plus fs-4"></i>
                  </span>
                  Criar canal
                </button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}