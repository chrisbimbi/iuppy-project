import { FC } from 'react'
import { JourneyStepCard } from './JourneyStepCard'
import { Droppable } from 'react-beautiful-dnd'
import { JourneyStep } from '../../types'

type Props = {
    day: number
    steps: JourneyStep[]
    onStepClick: (stepId: string) => void
    onAddStep: () => void
}

import { useIntl } from 'react-intl'

export const JourneyDayGroup: FC<Props> = ({ day, steps, onStepClick, onAddStep }) => {
    const intl = useIntl()
    return (
        <div className='d-flex mb-10 position-relative'>
            {/* Timeline Line */}
            <div
                className='position-absolute top-0 bottom-0 start-0 bg-secondary'
                style={{ width: '2px', left: '29px', zIndex: 0 }}
            />

            {/* Day Marker */}
            <div className='d-flex flex-column align-items-center me-5 position-relative' style={{ zIndex: 1, minWidth: '60px' }}>
                <div className='symbol symbol-60px mb-2 bg-white border border-secondary'>
                    <div className='symbol-label fs-2 fw-bolder text-gray-800'>
                        <i className="bi bi-calendar-event fs-2 text-primary"></i>
                    </div>
                </div>
                <div className='fw-bold text-gray-800 fs-6 bg-white px-2'>{intl.formatMessage({ id: 'JOURNEYS.BUILDER.DAY' }, { day })}</div>
            </div>

            {/* Steps Container */}
            <div className='flex-grow-1 pt-2'>
                <Droppable droppableId={day.toString()}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`d-flex flex-column gap-4 ${snapshot.isDraggingOver ? 'bg-light-primary rounded p-2' : ''}`}
                            style={{ minHeight: '100px' }}
                        >
                            {steps.map((step, index) => (
                                <JourneyStepCard
                                    key={step.id}
                                    id={step.id}
                                    index={index}
                                    title={step.title}
                                    type={step.type}
                                    time={step.time}
                                    onClick={() => onStepClick(step.id)}
                                />
                            ))}
                            {provided.placeholder}

                            {/* Add Step Button Placeholder */}
                            <button
                                className='btn btn-light-primary btn-sm border-dashed border-primary w-100 py-3 mt-2'
                                onClick={onAddStep}
                            >
                                <i className='bi bi-plus-lg me-2'></i>
                                {intl.formatMessage({ id: 'JOURNEYS.BUILDER.ADD_STEP' })}
                            </button>
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    )
}
