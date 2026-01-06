import React, { useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { uploadFileToFirebase } from '../../../../../utils/fileUtils'

type Attachment = {
    name: string
    url: string
    type?: string
}

type Props = {
    value?: Attachment[]
    onChanged: (attachments: Attachment[]) => void
    label?: string
    companyId: string
}

export const DocumentUploader: React.FC<Props> = ({ value = [], onChanged, label, companyId }) => {
    const intl = useIntl()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setUploading(true)
        setError(null)

        const newAttachments: Attachment[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                // Validate size (e.g. 50MB) 
                if (file.size > 50 * 1024 * 1024) {
                    setError('File too large (Max 50MB)')
                    continue
                }

                const { url } = await uploadFileToFirebase(file, companyId, 'attachment')
                newAttachments.push({
                    name: file.name,
                    url: url,
                    type: file.type
                })
            }

            onChanged([...value, ...newAttachments])

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

    const removeAttachment = (index: number) => {
        const newer = [...value]
        newer.splice(index, 1)
        onChanged(newer)
    }

    return (
        <div className='mb-8'>
            {label && <label className='form-label fw-bolder text-dark fs-6'>{label}</label>}

            <div
                className={`d-flex flex-column align-items-center justify-content-center bg-light rounded p-8 border border-dashed cursor-pointer position-relative ${dragActive ? 'border-primary bg-light-primary' : 'border-gray-300'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
                style={{ minHeight: '120px' }}
            >
                {uploading ? (
                    <div className='spinner-border text-primary' role='status'>
                        <span className='visually-hidden'>Loading...</span>
                    </div>
                ) : (
                    <>
                        <i className={`bi bi-cloud-upload fs-3x mb-2 ${dragActive ? 'text-primary' : 'text-muted'}`}></i>
                        <div className={`fs-7 ${dragActive ? 'text-primary fw-bold' : 'text-muted'}`}>
                            {intl.formatMessage({ id: 'JOURNEYS.STEP.DOC_UPLOAD_DESC', defaultMessage: 'Click or drag files here' })}
                        </div>
                    </>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="d-none"
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={uploading}
                />
            </div>

            {error && <div className="text-danger mt-2">{error}</div>}

            {/* List */}
            {value.length > 0 && (
                <div className='mt-4 d-flex flex-column gap-2'>
                    {value.map((att, idx) => (
                        <div key={idx} className='d-flex align-items-center justify-content-between p-3 bg-white border rounded'>
                            <div className='d-flex align-items-center overflow-hidden me-3'>
                                <i className='bi bi-file-earmark-text fs-4 text-primary me-3'></i>
                                <span className='text-gray-800 fw-bold text-truncate'>{att.name}</span>
                            </div>
                            <div className='d-flex align-items-center'>
                                <a href={att.url} target="_blank" rel="noreferrer" className='btn btn-icon btn-sm btn-light me-2' title="View" onClick={(e) => e.stopPropagation()}>
                                    <i className='bi bi-eye'></i>
                                </a>
                                <button className='btn btn-icon btn-sm btn-light-danger' onClick={(e) => {
                                    e.stopPropagation()
                                    removeAttachment(idx)
                                }}>
                                    <i className='bi bi-trash'></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
