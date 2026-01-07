import { FC, useState, useEffect } from 'react'
import { useIntl } from 'react-intl'
import Swal from 'sweetalert2'
import { KTSVG } from '../../../../../helpers'
import { ImageUploader } from './ImageUploader'
import { DocumentUploader } from './DocumentUploader'
import { VideoUploader } from './VideoUploader'
import { useAuth } from '../../../../modules/auth'
import QuillWrapper from '../../../../../components/QuillWrapper'
import { FormsApi } from '../../../forms/services/api'

import { InlineFormBuilder } from '../InlineFormBuilder'
import { InlinePollBuilder } from '../InlinePollBuilder'

type Props = {
    stepId: string
    initialData: any
    onClose: () => void
    onSave: (data: any) => void
    onDelete: () => void
    journeyId?: string | null
}

export const StepEditorPanel: FC<Props> = ({ stepId, initialData, onClose, onSave, onDelete, journeyId }) => {
    const intl = useIntl()
    const { currentUser } = useAuth()
    const [title, setTitle] = useState(initialData?.title || '')
    const [day, setDay] = useState(initialData?.delayDays !== undefined ? initialData.delayDays + 1 : 1)
    const [time, setTime] = useState(initialData?.time || '09:00')
    const [content, setContent] = useState(initialData?.contentPayload?.htmlContent || '')
    const [imageUrl, setImageUrl] = useState(initialData?.contentPayload?.imageUrl || '')
    const [showWidgetPicker, setShowWidgetPicker] = useState(false)

    // New Fields
    const [contentType, setContentType] = useState<'ARTICLE' | 'VIDEO' | 'QUIZ' | 'POLL' | 'FORM'>(initialData?.contentType || 'ARTICLE')
    const [mediaType, setMediaType] = useState<'NONE' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>(initialData?.mediaType || 'NONE')
    const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '')
    const [attachments, setAttachments] = useState<any[]>(initialData?.contentPayload?.attachments || [])
    const [requireAck, setRequireAck] = useState(initialData?.requireAck || false)

    // New State for Video Source
    const [videoSourceType, setVideoSourceType] = useState<'LINK' | 'UPLOAD'>(
        (initialData?.mediaUrl && initialData.mediaUrl.includes('firebasestorage')) ? 'UPLOAD' : 'LINK'
    )

    // Sync state
    useEffect(() => {
        if (mediaType !== 'VIDEO') return;
        if (mediaUrl && mediaUrl.includes('firebasestorage')) {
            setVideoSourceType('UPLOAD')
        }
    }, [mediaUrl, mediaType])
    const [linkedFormId, setLinkedFormId] = useState(initialData?.linkedFormId || '')
    const [formConfig, setFormConfig] = useState(initialData?.formConfig || {})
    const [pollConfig, setPollConfig] = useState(initialData?.pollConfig || {})

    // Push Notification Fields
    const [sendPush, setSendPush] = useState(!!initialData?.pushTitle)
    const [pushTitle, setPushTitle] = useState(initialData?.pushTitle || '')
    const [pushMessage, setPushMessage] = useState(initialData?.pushMessage || '')

    const [availableForms, setAvailableForms] = useState<any[]>([])

    // Sync with initialData when it changes (e.g. switching steps)
    useEffect(() => {
        setTitle(initialData?.title || '')
        setTime(initialData?.time || '09:00')
        setContent(initialData?.contentPayload?.htmlContent || '')
        setImageUrl(initialData?.contentPayload?.imageUrl || '')
        setDay(initialData?.delayDays !== undefined ? initialData.delayDays + 1 : 1)
        setContentType(initialData?.contentType || 'ARTICLE')
        setMediaType(initialData?.mediaType || 'NONE')
        setMediaUrl(initialData?.mediaUrl || '')
        setAttachments(initialData?.contentPayload?.attachments || [])
        setRequireAck(initialData?.requireAck || false)
        setLinkedFormId(initialData?.linkedFormId || '')
        setFormConfig(initialData?.formConfig || {})
        setPollConfig(initialData?.pollConfig || {})

        setSendPush(!!initialData?.pushTitle)
        setPushTitle(initialData?.pushTitle || '')
        setPushMessage(initialData?.pushMessage || '')
    }, [initialData])

    useEffect(() => {
        // Load forms for selection
        if (currentUser?.companyId) {
            FormsApi.list({ companyId: currentUser.companyId })
                .then((res: any) => {
                    setAvailableForms(res.items || [])
                })
                .catch(err => console.error('Failed to load forms', err))
        }
    }, [currentUser])

    const handleSave = () => {
        onSave({
            title,
            time,
            delayDays: day - 1, // Convert back to 0-indexed delay
            contentPayload: {
                htmlContent: content,
                imageUrl: imageUrl,
                attachments: attachments
            },
            mediaType,
            mediaUrl: (mediaType === 'DOCUMENT' && attachments.length > 0) ? attachments[0].url : mediaUrl, // Compatibility
            requireAck,
            linkedFormId,
            contentType,
            formConfig,
            pollConfig,
            pushTitle: sendPush ? pushTitle : null,
            pushMessage: sendPush ? pushMessage : null
        })
    }

    const insertWidget = (widgetTag: string) => {
        setContent((prev: string) => prev + ` ${widgetTag} `)
        setShowWidgetPicker(false)
    }

    return (
        <div className='bg-white shadow-lg position-fixed top-0 end-0 bottom-0 w-100 mw-900px z-index-drawer d-flex flex-column' style={{ zIndex: 1001 }}>

            {/* Header */}
            <div className='card-header d-flex align-items-center justify-content-between py-4 px-6 border-bottom'>
                <div className='d-flex align-items-center'>
                    <button className='btn btn-icon btn-sm btn-active-light-primary me-3' onClick={onClose}>
                        <KTSVG path='../media/icons/duotune/arrows/arr063.svg' className='svg-icon-1' />
                    </button>
                    <h3 className='card-title m-0'>
                        {intl.formatMessage({ id: 'JOURNEYS.STEP.EDIT' })}
                    </h3>
                </div>
                <div>
                    <button
                        className='btn btn-light-danger me-3'
                        onClick={() => {
                            Swal.fire({
                                title: intl.formatMessage({ id: 'JOURNEYS.EDITOR.DELETE.TITLE' }),
                                text: intl.formatMessage({ id: 'JOURNEYS.EDITOR.DELETE.TEXT' }),
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: intl.formatMessage({ id: 'JOURNEYS.EDITOR.DELETE.CONFIRM' }),
                                cancelButtonText: intl.formatMessage({ id: 'JOURNEYS.STEP.CANCEL' })
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    onDelete()
                                }
                            })
                        }}
                    >
                        {intl.formatMessage({ id: 'JOURNEYS.EDITOR.BTN.DELETE' })}
                    </button>
                    <button className='btn btn-light me-3' onClick={onClose}>
                        {intl.formatMessage({ id: 'JOURNEYS.STEP.CANCEL' })}
                    </button>
                    <button
                        className='btn btn-primary'
                        onClick={handleSave}
                    >
                        {intl.formatMessage({ id: 'JOURNEYS.STEP.SAVE' })}
                    </button>
                </div>
            </div>

            <div className='d-flex flex-grow-1 overflow-hidden'>

                {/* Left Column: Content */}
                <div className='flex-grow-1 p-8 overflow-auto'>
                    <div className='mb-8'>
                        <label className='form-label fw-bolder text-dark fs-6 required'>
                            {intl.formatMessage({ id: 'JOURNEYS.STEP.TITLE' })}
                        </label>
                        <input
                            type='text'
                            className='form-control form-control-lg form-control-solid'
                            placeholder={intl.formatMessage({ id: 'JOURNEYS.EDITOR.PLACEHOLDER.TITLE' })}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Content Type Selector */}
                    <div className='mb-8'>
                        <label className='form-label fw-bolder text-dark fs-6'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.CONTENT_TYPE' })}</label>
                        <select
                            className='form-select form-select-solid'
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value as any)}
                        >
                            <option value="ARTICLE">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.TYPE.ARTICLE' })}</option>
                            <option value="FORM">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.TYPE.FORM' })}</option>
                            <option value="POLL">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.TYPE.POLL' })}</option>
                        </select>
                    </div>

                    {contentType === 'ARTICLE' && (
                        <>
                            {/* Media Type Selector */}
                            <div className='mb-8'>
                                <label className='form-label fw-bolder text-dark fs-6'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.MEDIA_TYPE' })}</label>
                                <select
                                    className='form-select form-select-solid'
                                    value={mediaType}
                                    onChange={(e) => setMediaType(e.target.value as any)}
                                >
                                    <option value="NONE">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.MEDIA.NONE' })}</option>
                                    <option value="IMAGE">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.MEDIA.IMAGE' })}</option>
                                    <option value="VIDEO">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.MEDIA.VIDEO' })}</option>
                                    <option value="DOCUMENT">{intl.formatMessage({ id: 'JOURNEYS.EDITOR.MEDIA.DOCUMENT' })}</option>
                                </select>
                            </div>

                            {/* Media Input */}
                            {mediaType === 'IMAGE' && (
                                <ImageUploader
                                    label={intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.HEADER_IMAGE' })}
                                    value={imageUrl}
                                    onUploaded={(url) => {
                                        setImageUrl(url)
                                        setMediaUrl(url)
                                    }}
                                    companyId={currentUser?.companyId || ''}
                                />
                            )}

                            {mediaType === 'VIDEO' && (
                                <div className='mb-8'>
                                    <label className='form-label fw-bold'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.VIDEO_SOURCE' })}</label>

                                    {/* Source Toggle */}
                                    <div className="d-flex gap-4 mb-4">
                                        <label className="form-check form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="videoSource"
                                                checked={videoSourceType === 'LINK'}
                                                onChange={() => {
                                                    setVideoSourceType('LINK')
                                                    setMediaUrl('') // Clear only if switching intent manually
                                                }}
                                            />
                                            <span className="form-check-label fw-bold text-gray-700">
                                                {intl.formatMessage({ id: 'JOURNEYS.EDITOR.SOURCE.LINK' })}
                                            </span>
                                        </label>
                                        <label className="form-check form-check-custom form-check-solid">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="videoSource"
                                                checked={videoSourceType === 'UPLOAD'}
                                                onChange={() => {
                                                    setVideoSourceType('UPLOAD')
                                                    setMediaUrl('') // Clear only if switching intent manually
                                                }}
                                            />
                                            <span className="form-check-label fw-bold text-gray-700">
                                                {intl.formatMessage({ id: 'JOURNEYS.EDITOR.SOURCE.UPLOAD' })}
                                            </span>
                                        </label>
                                    </div>

                                    {/* Render based on Source check */}
                                    {videoSourceType === 'LINK' ? (
                                        <>
                                            <label className='form-label fw-bold'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.VIDEO_URL' })}</label>
                                            <input
                                                type='text'
                                                className='form-control form-control-solid'
                                                placeholder='YouTube, Vimeo, Drive...'
                                                value={mediaUrl}
                                                onChange={(e) => setMediaUrl(e.target.value)}
                                            />
                                            <div className='form-text text-muted'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.HELP.VIDEO_URL' })}</div>
                                            {mediaUrl && !mediaUrl.includes('youtube') && !mediaUrl.includes('youtu.be') && (
                                                <div className="alert alert-warning mt-2 d-flex align-items-center p-2 mb-0">
                                                    <i className="bi bi-exclamation-triangle text-warning me-2 fs-4"></i>
                                                    <div className="fs-7">
                                                        {intl.formatMessage({ id: 'JOURNEYS.EDITOR.WARN.EXTERNAL_TRACKING' })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <VideoUploader
                                            label={intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.VIDEO_FILE' })}
                                            value={mediaUrl ? [{ name: 'Uploaded Video', url: mediaUrl, type: 'video/mp4' }] : []}
                                            onChanged={(atts) => {
                                                if (atts.length > 0) {
                                                    setMediaUrl(atts[0].url)
                                                } else {
                                                    setMediaUrl('')
                                                }
                                            }}
                                            companyId={currentUser?.companyId || ''}
                                            stepId={stepId}
                                        />
                                    )}
                                </div>
                            )}

                            {mediaType === 'DOCUMENT' && (
                                <DocumentUploader
                                    label={intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.DOCS' })}
                                    value={attachments}
                                    onChanged={(atts) => {
                                        setAttachments(atts)
                                        // Update mediaUrl for compat if needed (first one)
                                        if (atts.length > 0) {
                                            setMediaUrl(atts[0].url)
                                        } else {
                                            setMediaUrl('')
                                        }
                                    }}
                                    companyId={currentUser?.companyId || ''}
                                />
                            )}

                            <div className='mb-8'>
                                <div className='d-flex justify-content-between align-items-center mb-2'>
                                    <label className='form-label fw-bolder text-dark fs-6'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.CONTENT' })}</label>
                                    <button
                                        className='btn btn-sm btn-light-warning fw-bold'
                                        onClick={() => setShowWidgetPicker(true)}
                                    >
                                        <i className='bi bi-plus-lg me-1'></i> {intl.formatMessage({ id: 'JOURNEYS.EDITOR.BTN.WIDGET' })}
                                    </button>
                                </div>

                                <div className='h-400px'>
                                    <QuillWrapper
                                        value={content}
                                        onChange={setContent}
                                        height="350px"
                                        companyId={currentUser?.companyId || ''}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {contentType === 'FORM' && (
                        <div className='mb-8'>
                            <InlineFormBuilder
                                value={formConfig}
                                onChange={setFormConfig}
                                locales={['pt-BR', 'en', 'es-ES']}
                            />
                        </div>
                    )}

                    {contentType === 'POLL' && (
                        <div className='mb-8'>
                            <InlinePollBuilder
                                value={pollConfig}
                                onChange={setPollConfig}
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Settings */}
                <div className='w-300px bg-light border-start p-6 overflow-auto'>

                    <div className='mb-10'>
                        <h4 className='text-dark fw-bolder mb-4'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.SECTION.SCHEDULE' })}</h4>

                        <div className='mb-4'>
                            <label className='form-label fs-7 fw-bold text-muted'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.DAY' })}</label>
                            <input
                                type='number'
                                className='form-control form-control-sm form-control-solid'
                                value={day}
                                onChange={(e) => setDay(parseInt(e.target.value))}
                                min={1}
                            />
                            <div className='form-text text-muted'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.HELP.DAY' })}</div>
                        </div>
                        <div className='mb-4'>
                            <label className='form-label fs-7 fw-bold text-muted'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.TIME' })}</label>
                            <input
                                type='time'
                                className='form-control form-control-sm form-control-solid'
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='separator separator-dashed my-8'></div>

                    <div className='mb-10'>
                        <h4 className='text-dark fw-bolder mb-4'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.SECTION.SETTINGS' })}</h4>

                        <div className='d-flex align-items-center justify-content-between mb-4'>
                            <span className='text-gray-800 fw-bold fs-6'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.ACK' })}</span>
                            <div className='form-check form-check-solid form-switch'>
                                <input
                                    className='form-check-input'
                                    type='checkbox'
                                    checked={requireAck}
                                    onChange={(e) => setRequireAck(e.target.checked)}
                                />
                            </div>
                        </div>

                        <div className='mb-4'>
                            <div className='d-flex align-items-center justify-content-between mb-2'>
                                <span className='text-gray-800 fw-bold fs-6'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.PUSH' })}</span>
                                <div className='form-check form-check-solid form-switch'>
                                    <input
                                        className='form-check-input'
                                        type='checkbox'
                                        checked={sendPush}
                                        onChange={(e) => setSendPush(e.target.checked)}
                                    />
                                </div>
                            </div>

                            {sendPush && (
                                <div className='ps-4 border-start border-gray-300 ms-2'>
                                    <div className='mb-4'>
                                        <label className='form-label fs-7 fw-bold text-muted'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.PUSH_TITLE' })}</label>
                                        <input
                                            type='text'
                                            className='form-control form-control-sm form-control-solid'
                                            value={pushTitle}
                                            onChange={(e) => setPushTitle(e.target.value)}
                                            placeholder={intl.formatMessage({ id: 'JOURNEYS.EDITOR.PLACEHOLDER.PUSH_TITLE' })}
                                        />
                                    </div>
                                    <div className='mb-4'>
                                        <label className='form-label fs-7 fw-bold text-muted'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.PUSH_MSG' })}</label>
                                        <textarea
                                            className='form-control form-control-sm form-control-solid'
                                            rows={3}
                                            value={pushMessage}
                                            onChange={(e) => setPushMessage(e.target.value)}
                                            placeholder={intl.formatMessage({ id: 'JOURNEYS.EDITOR.PLACEHOLDER.PUSH_MSG' })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='d-flex align-items-center justify-content-between'>
                            <span className='text-gray-800 fw-bold fs-6'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.LABEL.EMAIL' })}</span>
                            <div className='form-check form-check-solid form-switch'>
                                <input className='form-check-input' type='checkbox' />
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Widget Picker Modal */}
            {showWidgetPicker && (
                <div className='position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center' style={{ zIndex: 1002, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className='bg-white rounded shadow-lg w-500px'>
                        <div className='card-header d-flex justify-content-between align-items-center p-5 border-bottom'>
                            <h3 className='card-title m-0'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.WIDGET.TITLE' })}</h3>
                            <button className='btn btn-icon btn-sm btn-light' onClick={() => setShowWidgetPicker(false)}>
                                <i className='bi bi-x fs-2'></i>
                            </button>
                        </div>
                        <div className='card-body p-5'>
                            <div className='row g-3'>
                                <div className='col-6'>
                                    <div className='border rounded p-4 text-center hover-elevate-up cursor-pointer bg-light-primary border-primary border-dashed' onClick={() => insertWidget('{{user.firstName}}')}>
                                        <i className='bi bi-person-badge fs-2x text-primary mb-2'></i>
                                        <div className='fw-bold text-gray-800'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.WIDGET.USER_NAME' })}</div>
                                        <div className='text-muted fs-7'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.WIDGET.USER_NAME_DESC' })}</div>
                                    </div>
                                </div>
                                <div className='col-6'>
                                    <div className='border rounded p-4 text-center hover-elevate-up cursor-pointer' onClick={() => insertWidget('{{company.name}}')}>
                                        <i className='bi bi-building fs-2x text-gray-600 mb-2'></i>
                                        <div className='fw-bold text-gray-800'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.WIDGET.COMPANY_NAME' })}</div>
                                        <div className='text-muted fs-7'>{intl.formatMessage({ id: 'JOURNEYS.EDITOR.WIDGET.COMPANY_NAME_DESC' })}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
