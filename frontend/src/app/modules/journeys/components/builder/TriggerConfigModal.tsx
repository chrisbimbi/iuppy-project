import { FC, useState } from 'react'
import { KTSVG } from '../../../../../helpers'
import AudiencePicker from '../../../forms/components/AudiencePicker'

type Props = {
    show: boolean
    onClose: () => void
    onSave: (config: any) => void
}

type TriggerType = 'new_users' | 'specific_group' | null

import { useIntl } from 'react-intl'

export const TriggerConfigModal: FC<Props> = ({ show, onClose, onSave }) => {
    const intl = useIntl()
    const [step, setStep] = useState(1)
    const [selectedType, setSelectedType] = useState<'ONBOARDING' | 'DATE_BASED' | null>(null)
    const [audience, setAudience] = useState<{ spaceIds: string[]; groupIds: string[] }>({ spaceIds: [], groupIds: [] })
    const [rejoin, setRejoin] = useState<'continue' | 'restart'>('continue')
    const [startDate, setStartDate] = useState<string>('')

    if (!show) return null

    return (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className='modal-dialog modal-dialog-centered mw-800px'>
                <div className='modal-content'>

                    {/* Header */}
                    <div className='modal-header pb-0 border-0 justify-content-end'>
                        <div className='btn btn-sm btn-icon btn-active-color-primary' onClick={onClose}>
                            <KTSVG path='../media/icons/duotune/arrows/arr061.svg' className='svg-icon-1' />
                        </div>
                    </div>

                    {/* Body */}
                    <div className='modal-body scroll-y px-10 px-lg-15 pt-0 pb-15'>

                        {/* Stepper Header */}
                        <div className='mb-13 text-center'>
                            <h1 className='mb-3'>
                                {step === 1 ? intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TITLE.TYPE' }) : intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TITLE.CONFIG' })}
                            </h1>
                            <div className='text-muted fw-bold fs-5'>
                                {step === 1
                                    ? intl.formatMessage({ id: 'JOURNEYS.TRIGGER.SUBTITLE.TYPE' })
                                    : intl.formatMessage({ id: 'JOURNEYS.TRIGGER.SUBTITLE.CONFIG' })
                                }
                            </div>

                            {/* Stepper Dots */}
                            <div className='d-flex justify-content-center mt-8'>
                                <div className={`w-40px h-40px rounded-circle d-flex align-items-center justify-content-center fw-bolder fs-4 me-5 ${step === 1 ? 'bg-primary text-white' : 'bg-light text-gray-400'}`}>1</div>
                                <div className='h-2px w-50px bg-gray-200 my-auto me-5'></div>
                                <div className={`w-40px h-40px rounded-circle d-flex align-items-center justify-content-center fw-bolder fs-4 ${step === 2 ? 'bg-primary text-white' : 'bg-light text-gray-400'}`}>2</div>
                            </div>
                        </div>

                        {/* Step 1: Selection */}
                        {step === 1 && (
                            <div className='row g-5'>
                                <div className='col-md-6'>
                                    <div
                                        className={`card card-dashed h-100 p-6 cursor-pointer hover-elevate-up ${selectedType === 'ONBOARDING' ? 'border-primary bg-light-primary' : 'border-gray-300'}`}
                                        onClick={() => setSelectedType('ONBOARDING')}
                                    >
                                        <div className='d-flex flex-column align-items-center text-center'>
                                            <KTSVG path='../media/icons/duotune/communication/com013.svg' className='svg-icon-3x mb-5' />
                                            <h3 className='fs-4 fw-bolder mb-2'>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TYPE.ONBOARDING' })}</h3>
                                            <div className='text-gray-600'>
                                                {intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TYPE.ONBOARDING_DESC' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div
                                        className={`card card-dashed h-100 p-6 cursor-pointer hover-elevate-up ${selectedType === 'DATE_BASED' ? 'border-primary bg-light-primary' : 'border-gray-300'}`}
                                        onClick={() => setSelectedType('DATE_BASED')}
                                    >
                                        <div className='d-flex flex-column align-items-center text-center'>
                                            <KTSVG path='../media/icons/duotune/general/gen014.svg' className='svg-icon-3x mb-5' />
                                            <h3 className='fs-4 fw-bolder mb-2'>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TYPE.DATE' })}</h3>
                                            <div className='text-gray-600'>
                                                {intl.formatMessage({ id: 'JOURNEYS.TRIGGER.TYPE.DATE_DESC' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Configuration */}
                        {step === 2 && (
                            <div>
                                {selectedType === 'DATE_BASED' && (
                                    <div className='mb-10'>
                                        <label className='form-label fw-bold required'>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.START_DATE' })}</label>
                                        <input
                                            type='datetime-local'
                                            className='form-control form-control-solid'
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                        <div className='form-text'>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.START_DATE_HELP' })}</div>
                                    </div>
                                )}

                                <div className='mb-10'>
                                    <label className='form-label fw-bold'>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.AUDIENCE' })}</label>
                                    <AudiencePicker
                                        value={audience}
                                        onChange={setAudience}
                                    />
                                </div>

                                <div className='mb-10'>
                                    <label className='form-label fw-bold mb-5'>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.REJOIN_POLICY' })}</label>
                                    <div className='form-check form-check-custom form-check-solid mb-3'>
                                        <input
                                            className='form-check-input'
                                            type='radio'
                                            name='rejoin'
                                            id='rejoin_continue'
                                            checked={rejoin === 'continue'}
                                            onChange={() => setRejoin('continue')}
                                        />
                                        <label className='form-check-label' htmlFor='rejoin_continue'>
                                            {intl.formatMessage({ id: 'JOURNEYS.TRIGGER.REJOIN.CONTINUE' })}
                                        </label>
                                    </div>
                                    <div className='form-check form-check-custom form-check-solid'>
                                        <input
                                            className='form-check-input'
                                            type='radio'
                                            name='rejoin'
                                            id='rejoin_restart'
                                            checked={rejoin === 'restart'}
                                            onChange={() => setRejoin('restart')}
                                        />
                                        <label className='form-check-label' htmlFor='rejoin_restart'>
                                            {intl.formatMessage({ id: 'JOURNEYS.TRIGGER.REJOIN.RESTART' })}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className='modal-footer'>
                        <button type='button' className='btn btn-light' onClick={onClose}>{intl.formatMessage({ id: 'JOURNEYS.STEP.CANCEL' })}</button>

                        {step === 1 ? (
                            <button
                                type='button'
                                className='btn btn-primary'
                                disabled={!selectedType}
                                onClick={() => setStep(2)}
                            >
                                {intl.formatMessage({ id: 'JOURNEYS.TRIGGER.BTN.NEXT' })}
                            </button>
                        ) : (
                            <div className='d-flex'>
                                <button type='button' className='btn btn-light me-3' onClick={() => setStep(1)}>{intl.formatMessage({ id: 'JOURNEYS.TRIGGER.BTN.BACK' })}</button>
                                <button
                                    className='btn btn-primary'
                                    onClick={() => {
                                        const config = {
                                            triggerType: selectedType,
                                            targetAudience: audience,
                                            startDate: selectedType === 'DATE_BASED' ? startDate : null,
                                            restartPolicy: rejoin === 'continue' ? 'RESUME' : 'RESTART'
                                        }
                                        onSave(config)
                                    }}
                                >
                                    {intl.formatMessage({ id: 'JOURNEYS.TRIGGER.BTN.DONE' })}
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
