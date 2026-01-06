import { FC } from 'react'
import { KTSVG } from '../../../../../helpers'
import { Draggable } from 'react-beautiful-dnd'

type Props = {
    id: string
    index: number
    title: string
    type: 'article' | 'video' | 'quiz' | 'poll' | 'form'
    time?: string
    onClick: () => void
}

export const JourneyStepCard: FC<Props> = ({ id, index, title, type, time, onClick }) => {
    const getIconPath = () => {
        switch (type) {
            case 'video': return '../media/icons/duotune/general/gen005.svg'
            case 'article': return '../media/icons/duotune/communication/com014.svg'
            case 'quiz': return '../media/icons/duotune/communication/com013.svg'
            case 'poll': return '../media/icons/duotune/general/gen014.svg'
            case 'form': return '../media/icons/duotune/general/gen014.svg'
            default: return '../media/icons/duotune/general/gen005.svg'
        }
    }

    return (
        <Draggable draggableId={id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`card shadow-sm cursor-pointer hover-elevate-up ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    onClick={onClick}
                    style={{
                        border: '1px solid #E4E6EF',
                        ...provided.draggableProps.style
                    }}
                >
                    <div className='card-body p-4 d-flex align-items-center'>
                        <div className='symbol symbol-40px me-4'>
                            <span className='symbol-label bg-light-primary'>
                                <KTSVG path={getIconPath()} className='svg-icon-2x svg-icon-primary' />
                            </span>
                        </div>

                        <div className='d-flex flex-column flex-grow-1'>
                            <span className='text-dark fw-bold fs-6 mb-1'>{title}</span>
                            {time && (
                                <span className='text-muted fs-7 fw-semibold'>
                                    {time}
                                </span>
                            )}
                        </div>

                        <div className='ms-2'>
                            <KTSVG path='../media/icons/duotune/arrows/arr064.svg' className='svg-icon-3 text-muted' />
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    )
}
