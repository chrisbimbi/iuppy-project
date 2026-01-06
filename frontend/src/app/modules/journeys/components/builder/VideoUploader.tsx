import React, { useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { uploadFileToFirebase, UploadProgress } from '../../../../../utils/fileUtils'

type VideoAttachment = {
    name: string
    url: string
    type?: string
}

type Props = {
    value?: VideoAttachment[]
    onChanged: (attachments: VideoAttachment[]) => void
    label?: string
    companyId: string
}

export const VideoUploader: React.FC<Props> = ({ value = [], onChanged, label, companyId }) => {
    const intl = useIntl()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setUploading(true)
        setProgress(0)
        setError(null)

        const file = files[0]

        // Validate Type
        if (!file.type.startsWith('video/')) {
            setError(intl.formatMessage({ id: 'ERRORS.INVALID_FILE_TYPE', defaultMessage: 'Invalid file type. Please upload a video.' }))
            setUploading(false)
            return
        }

        // Validate Size (e.g., 200MB max)
        if (file.size > 200 * 1024 * 1024) {
            setError('File too large (Max 200MB). Please compress using Handbrake.')
            setUploading(false)
            return
        }

        try {
            const { url } = await uploadFileToFirebase(
                file,
                companyId,
                'attachment',
                (p: UploadProgress) => setProgress(p.percent)
            )

            // Replace existing video (Single video logic for now, but array structure kept for consistency)
            const newVideo = {
                name: file.name,
                url: url,
                type: file.type
            }
            onChanged([newVideo])

        } catch (err: any) {
            console.error(err)
            setError(intl.formatMessage({ id: 'ERRORS.UPLOAD_FAILED', defaultMessage: 'Upload failed' }))
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const removeVideo = () => {
        onChanged([])
    }

    return (
        <div className='mb-8'>
            {label && <label className='form-label fw-bolder text-dark fs-6'>{label}</label>}

            {/* Upload Area (Hidden if has value) */}
            {value.length === 0 && (
                <div
                    className={`d-flex flex-column align-items-center justify-content-center bg-light rounded p-8 border border-dashed cursor-pointer position-relative ${dragActive ? 'border-primary bg-light-primary' : 'border-gray-300'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    style={{ minHeight: '120px' }}
                >
                    {uploading ? (
                        <div className='w-100 px-10'>
                            <div className='d-flex justify-content-between mb-2'>
                                <span className='text-gray-600'>Uploading...</span>
                                <span className='text-primary fw-bold'>{Math.round(progress)}%</span>
                            </div>
                            <div className="progress h-6px w-100 bg-light-primary">
                                <div
                                    className="progress-bar bg-primary"
                                    role="progressbar"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <i className={`bi bi-camera-video fs-3x mb-2 ${dragActive ? 'text-primary' : 'text-muted'}`}></i>
                            <div className={`fs-7 ${dragActive ? 'text-primary fw-bold' : 'text-muted'}`}>
                                {intl.formatMessage({ id: 'JOURNEYS.STEP.VIDEO_UPLOAD_DESC', defaultMessage: 'Click or drag video here (Max 200MB)' })}
                            </div>
                            <div className='text-muted fs-8 mt-2 text-center'>
                                Supported: MP4, MOV, WebM. <br />
                                <span className='text-warning'>Tip: Use Handbrake to compress large videos before uploading.</span>
                            </div>
                        </>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="video/*"
                        className="d-none"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={uploading}
                    />
                </div>
            )}

            {error && <div className="text-danger mt-2">{error}</div>}

            {/* Video Preview / List */}
            {value.map((vid, idx) => (
                <div key={idx} className='mt-2 d-flex flex-column p-4 bg-white border rounded'>
                    <div className='d-flex align-items-center justify-content-between mb-3'>
                        <div className='d-flex align-items-center overflow-hidden me-3'>
                            <i className='bi bi-film fs-4 text-primary me-3'></i>
                            <span className='text-gray-800 fw-bold text-truncate'>{vid.name}</span>
                        </div>
                        <button className='btn btn-icon btn-sm btn-light-danger' onClick={removeVideo}>
                            <i className='bi bi-trash'></i>
                        </button>
                    </div>
                    {/* Basic Video Preview */}
                    <div className='rounded overflow-hidden bg-black d-flex justify-content-center items-center' style={{ maxHeight: '200px' }}>
                        <video controls style={{ maxHeight: '200px', maxWidth: '100%' }}>
                            <source src={vid.url} type={vid.type || 'video/mp4'} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            ))}
        </div>
    )
}
