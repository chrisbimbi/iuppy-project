import { FC, useState, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { useParams, Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { KTSVG } from '../../../../../helpers'
import { JourneyDayGroup } from './JourneyDayGroup'
import { StepEditorPanel } from './StepEditorPanel'
import { TriggerConfigModal } from './TriggerConfigModal'
import { updateJourney, createJourney, getJourney } from '../../services/journeys.service'
import { JourneyDay, JourneyStep, Journey } from '../../types'
import { useAuth } from '../../../auth/core/Auth'

export const JourneyBuilderCanvas: FC = () => {
    const intl = useIntl()
    const { id } = useParams<{ id: string }>()
    const { currentUser } = useAuth()
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
    const [showTriggerModal, setShowTriggerModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [journeyId, setJourneyId] = useState<string | null>(id || null)
    const [title, setTitle] = useState('New Journey')
    const [endDate, setEndDate] = useState<string>('')
    const [isNr1, setIsNr1] = useState(false)
    const [journeyConfig, setJourneyConfig] = useState<any>({
        triggerType: 'ONBOARDING',
        targetAudience: null,
        startDate: null,
        restartPolicy: 'RESUME'
    })

    // Initial state
    const [days, setDays] = useState<JourneyDay[]>([
        {
            day: 1,
            steps: []
        }
    ])

    useEffect(() => {
        if (id) {
            loadJourney(id)
        }
    }, [id])

    const loadJourney = async (id: string) => {
        setLoading(true)
        try {
            const journey = await getJourney(id)
            setJourneyId(journey.id)
            setTitle(journey.title)
            setEndDate(journey.endDate ? new Date(journey.endDate).toISOString().slice(0, 16) : '')
            setIsNr1(journey.isNr1 || false)
            setJourneyConfig({
                triggerType: journey.triggerType,
                targetAudience: journey.targetAudience,
                startDate: journey.startDate,
                restartPolicy: journey.restartPolicy
            })

            // Reconstruct days from steps
            if (journey.steps && journey.steps.length > 0) {
                const daysMap = new Map<number, JourneyStep[]>()

                journey.steps.forEach(step => {
                    const dayNum = (step.delayDays || 0) + 1
                    const currentSteps = daysMap.get(dayNum) || []

                    currentSteps.push({
                        ...step,
                        type: (step.contentType?.toLowerCase() as any) || 'article',
                        time: step.releaseTime,
                        // Ensure ID and Title are not overwritten if they exist in step but we want to be explicit
                        id: step.id,
                        title: step.title,
                    })

                    // Sort by orderIndex if available, otherwise keep order
                    daysMap.set(dayNum, currentSteps)
                })

                const sortedDays: JourneyDay[] = Array.from(daysMap.entries())
                    .map(([day, steps]) => ({ day, steps }))
                    .sort((a, b) => a.day - b.day)

                setDays(sortedDays)
            }
        } catch (error) {
            console.error('Failed to load journey:', error)
            alert('Failed to load journey')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!currentUser?.companyId) {
            alert('Company ID missing')
            return
        }

        setLoading(true)
        try {
            const allSteps: any[] = []
            let orderIndex = 0

            days.forEach((day) => {
                day.steps.forEach((step) => {
                    // SANITIZE PAYLOAD: Only send fields expected by CreateJourneyStepDto
                    // Remove id, createdAt, updatedAt, journeyId if they exist (unless id is needed for update)

                    const stepPayload: any = {
                        title: step.title,
                        delayDays: day.day - 1,
                        releaseTime: step.time || null,
                        contentType: step.type?.toUpperCase() || 'ARTICLE',
                        mediaType: step.mediaType || 'NONE',
                        mediaUrl: step.mediaUrl || null,
                        videoConfig: step.videoConfig || null,
                        requireAck: step.requireAck,
                        formConfig: step.formConfig || null,
                        pollConfig: step.pollConfig || null,
                        quizConfig: step.quizConfig || null, // Ensure this passes
                        contentPayload: step.contentPayload || null,
                        smartFields: step.smartFields || null,
                        orderIndex: orderIndex++,
                        pushTitle: step.pushTitle || null,
                        pushMessage: step.pushMessage || null
                    }

                    // Only include ID if it's a real server ID (UUID) not a temp one (math.random)
                    // If it's a temp ID, we shouldn't send it, letting backend create new
                    // Check if it looks like a UUID
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step.id)
                    if (isUuid) {
                        stepPayload.id = step.id
                    }

                    allSteps.push(stepPayload)
                })
            })

            const payload = {
                companyId: currentUser.companyId,
                title,
                endDate: endDate || null,
                description: '',
                active: true,
                isNr1,
                ...journeyConfig,
                steps: allSteps
            }

            let savedJourney: Journey
            if (journeyId) {
                savedJourney = await updateJourney(journeyId, payload)
                Swal.fire({
                    text: intl.formatMessage({ id: 'JOURNEYS.SAVE.SUCCESS' }),
                    icon: 'success',
                    buttonsStyling: false,
                    confirmButtonText: 'Ok!',
                    customClass: { confirmButton: 'btn btn-primary' }
                })
            } else {
                savedJourney = await createJourney(payload)
                setJourneyId(savedJourney.id)
                Swal.fire({
                    text: intl.formatMessage({ id: 'JOURNEYS.SAVE.SUCCESS' }),
                    icon: 'success',
                    buttonsStyling: false,
                    confirmButtonText: 'Ok!',
                    customClass: { confirmButton: 'btn btn-primary' }
                })
            }

            // Reload to get real IDs
            loadJourney(savedJourney.id)

        } catch (error) {
            console.error('Failed to save journey:', error)
            Swal.fire({
                text: 'Failed to save journey. Check console for details.',
                icon: 'error',
                buttonsStyling: false,
                confirmButtonText: 'Ok',
                customClass: { confirmButton: 'btn btn-danger' }
            })
        } finally {
            setLoading(false)
        }
    }

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result

        // Dropped outside the list
        if (!destination) {
            return
        }

        // Dropped in the same place
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return
        }

        const sourceDayIndex = days.findIndex(d => d.day.toString() === source.droppableId)
        const destDayIndex = days.findIndex(d => d.day.toString() === destination.droppableId)

        const newDays = [...days]
        const sourceDay = newDays[sourceDayIndex]
        const destDay = newDays[destDayIndex]

        // Moving within the same day
        if (source.droppableId === destination.droppableId) {
            const newSteps = Array.from(sourceDay.steps)
            const [removed] = newSteps.splice(source.index, 1)
            newSteps.splice(destination.index, 0, removed)

            newDays[sourceDayIndex] = { ...sourceDay, steps: newSteps }
            setDays(newDays)
        } else {
            // Moving to another day
            const sourceSteps = Array.from(sourceDay.steps)
            const destSteps = Array.from(destDay.steps)
            const [removed] = sourceSteps.splice(source.index, 1)
            destSteps.splice(destination.index, 0, removed)

            newDays[sourceDayIndex] = { ...sourceDay, steps: sourceSteps }
            newDays[destDayIndex] = { ...destDay, steps: destSteps }
            setDays(newDays)
        }
    }

    const handleSaveStep = (stepId: string, data: any) => {
        // 1. Find the original step FIRST, before any mutation
        const originalStep = days.flatMap(d => d.steps).find(s => s.id === stepId)

        if (!originalStep) {
            console.error('Step not found:', stepId)
            return
        }

        // 2. Create a deep copy of days to avoid mutating state
        const updatedDays = days.map(day => ({
            ...day,
            steps: [...day.steps]
        }))

        let stepFound = false

        // 3. Remove the step from its current location
        for (let i = 0; i < updatedDays.length; i++) {
            const stepIndex = updatedDays[i].steps.findIndex(s => s.id === stepId)
            if (stepIndex !== -1) {
                updatedDays[i].steps.splice(stepIndex, 1)
                stepFound = true
                break
            }
        }

        if (stepFound) {
            // 4. Determine target day index
            const targetDayIndex = data.delayDays // delayDays is 0-indexed

            // 5. Ensure target day exists
            while (updatedDays.length <= targetDayIndex) {
                updatedDays.push({
                    day: updatedDays.length + 1, // 1-indexed
                    steps: []
                })
            }

            // 6. Add updated step to target day
            updatedDays[targetDayIndex].steps.push({
                ...originalStep,
                ...data,
                delayDays: targetDayIndex // Ensure delayDays is consistent
            })

            setDays(updatedDays)
            setSelectedStepId(null)
        }
    }

    const handleDeleteStep = (stepId: string) => {
        const updatedDays = [...days]
        for (let i = 0; i < updatedDays.length; i++) {
            const stepIndex = updatedDays[i].steps.findIndex(s => s.id === stepId)
            if (stepIndex !== -1) {
                updatedDays[i].steps.splice(stepIndex, 1)
                break
            }
        }
        setDays(updatedDays)
        setSelectedStepId(null)
    }

    const handleAddDay = () => {
        const lastDay = days.length > 0 ? days[days.length - 1].day : 0
        setDays([...days, { day: lastDay + 1, steps: [] }])
    }

    const handleAddStep = (dayIndex: number) => {
        const newStepId = Math.random().toString(36).substr(2, 9)
        const newStep: JourneyStep = {
            id: newStepId,
            title: 'New Step',
            type: 'article',
            time: '09:00',
            delayDays: dayIndex // Set correct delayDays based on the day column
        }

        const newDays = days.map((day, index) => {
            if (index === dayIndex) {
                return {
                    ...day,
                    steps: [...day.steps, newStep]
                }
            }
            return day
        })

        setDays(newDays)
        setSelectedStepId(newStepId)
    }

    const selectedStep = selectedStepId
        ? days.flatMap(d => d.steps).find(s => s.id === selectedStepId)
        : null

    return (
        <div className='d-flex flex-column align-items-center w-100 mw-800px mx-auto py-10'>

            {/* Header: Title & Expiration */}
            <div className='w-100 card mb-10 p-6'>
                <div className='d-flex align-items-center mb-6'>
                    <Link to='/journeys' className='btn btn-sm btn-icon btn-light me-3'>
                        <KTSVG path='../media/icons/duotune/arrows/arr063.svg' className='svg-icon-2' />
                    </Link>
                    <h3 className='card-title m-0'>
                        {intl.formatMessage({ id: 'JOURNEYS.BUILDER.TITLE', defaultMessage: 'Journey Builder' })}
                    </h3>
                </div>

                <div className='row'>
                    <div className='col-md-8'>
                        <label className='form-label fw-bold required'>{intl.formatMessage({ id: 'JOURNEYS.BUILDER.FORM.TITLE_LABEL' })}</label>
                        <input
                            type='text'
                            className='form-control form-control-solid form-control-lg'
                            placeholder={intl.formatMessage({ id: 'JOURNEYS.BUILDER.FORM.TITLE_PLACEHOLDER' })}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className='col-md-4'>
                        <label className='form-label fw-bold'>{intl.formatMessage({ id: 'JOURNEYS.BUILDER.FORM.EXPIRATION_LABEL' })}</label>
                        <input
                            type='datetime-local'
                            className='form-control form-control-solid'
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <div className='form-text text-muted'>{intl.formatMessage({ id: 'JOURNEYS.BUILDER.FORM.EXPIRATION_HELP' })}</div>
                    </div>
                    <div className='col-md-4'>
                        <label className='form-label fw-bold'>Treinamento NR-1</label>
                        <div className='form-check form-switch form-check-custom form-check-solid'>
                            <input
                                className='form-check-input'
                                type='checkbox'
                                checked={isNr1}
                                onChange={(e) => setIsNr1(e.target.checked)}
                                id='isNr1Checkbox'
                            />
                            <label className='form-check-label' htmlFor='isNr1Checkbox'>
                                Marcar como conteúdo de Segurança do Trabalho (NR-1)
                            </label>
                        </div>
                        <div className='form-text text-muted'>Treinamentos NR-1 aparecem no módulo de Compliance</div>
                    </div>
                </div>
            </div>

            {/* Toolbar (Temporary) */}
            <div className='w-100 d-flex justify-content-end mb-5'>
                <button
                    className='btn btn-primary'
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading
                        ? intl.formatMessage({ id: 'JOURNEYS.BUILDER.SAVING' })
                        : intl.formatMessage({ id: 'JOURNEYS.BUILDER.SAVE' })}
                </button>
            </div>

            {/* Journey Start Node */}
            <div className='d-flex flex-column align-items-center mb-10 position-relative'>
                <div
                    className='position-absolute top-100 start-50 translate-middle-x bg-secondary'
                    style={{ width: '2px', height: '40px', zIndex: 0 }}
                />

                <div className='symbol symbol-80px mb-4'>
                    <div className='symbol-label bg-light-success border border-success border-dashed'>
                        <i className="bi bi-flag-fill fs-1 text-success"></i>
                    </div>
                </div>
                <h3 className='fs-2 fw-bolder text-dark mb-1'>
                    {intl.formatMessage({ id: 'JOURNEYS.BUILDER.START_NODE' })}
                </h3>
                <div className='text-muted fs-6 mb-4'>
                    {intl.formatMessage(
                        { id: 'JOURNEYS.BUILDER.FORM.TRIGGER_INFO' },
                        {
                            type: journeyConfig.triggerType === 'ONBOARDING'
                                ? intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TYPE.ONBOARDING' })
                                : intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TYPE.DATE' })
                        }
                    )}
                    {journeyConfig.startDate && ` (Starts: ${new Date(journeyConfig.startDate).toLocaleDateString()})`}
                </div>

                <button
                    className='btn btn-sm btn-light-primary'
                    onClick={() => setShowTriggerModal(true)}
                >
                    <i className='bi bi-gear-fill me-2'></i>
                    {intl.formatMessage({ id: 'JOURNEYS.BUILDER.CONFIGURE_TRIGGER' })}
                </button>
            </div>

            {/* Days List */}
            <div className='w-100'>
                <DragDropContext onDragEnd={onDragEnd}>
                    {days.map((d, index) => (
                        <JourneyDayGroup
                            key={d.day}
                            day={d.day}
                            steps={d.steps}
                            onStepClick={(id) => setSelectedStepId(id)}
                            onAddStep={() => handleAddStep(index)}
                        />
                    ))}
                </DragDropContext>

                {/* Add Day Button */}
                <div className='d-flex justify-content-center mt-5'>
                    <button className='btn btn-primary' onClick={handleAddDay}>
                        <i className='bi bi-calendar-plus me-2'></i>
                        {intl.formatMessage({ id: 'JOURNEYS.BUILDER.ADD_DAY' })}
                    </button>
                </div>
            </div>

            {/* Conditionally render StepEditorPanel */}
            {selectedStep && (
                <StepEditorPanel
                    stepId={selectedStep.id}
                    initialData={selectedStep}
                    onClose={() => setSelectedStepId(null)}
                    onSave={(data) => handleSaveStep(selectedStep.id, data)}
                    onDelete={() => handleDeleteStep(selectedStep.id)}
                    journeyId={journeyId}
                />
            )}

            {/* Trigger Config Modal */}
            <TriggerConfigModal
                show={showTriggerModal}
                onClose={() => setShowTriggerModal(false)}
                onSave={(config) => {
                    console.log('Trigger config saved:', config)
                    setJourneyConfig(config)
                    setShowTriggerModal(false)
                }}
            />

        </div>
    )
}
