import React, { useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { uploadFileToFirebase } from '../../../../../utils/fileUtils'

type Props = {
    value?: string | null
    onUploaded: (url: string) => void
    label?: string
    companyId: string
}

export const ImageUploader: React.FC<Props> = ({ value, onUploaded, label, companyId }) => {
    const intl = useIntl()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setError(null)

        try {
            const { url } = await uploadFileToFirebase(file, companyId, 'attachment')
            onUploaded(url)
        } catch (err: any) {
            console.error(err)
            setError(intl.formatMessage({ id: 'ERRORS.UPLOAD_FAILED', defaultMessage: 'Upload failed' }))
        } finally {
            setUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div className='mb-8'>
            {label && <label className='form-label fw-bolder text-dark fs-6'>{label}</label>}

            <div
                className='d-flex align-items-center justify-content-center bg-light rounded p-10 border border-dashed border-gray-300 cursor-pointer position-relative'
                onClick={() => !uploading && inputRef.current?.click()}
                style={{ minHeight: '150px' }}
            >
                {value ? (
                    <div className='position-relative w-100 h-100 d-flex justify-content-center'>
                        <img
                            src={value}
                            alt="Uploaded"
                            style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                        <button
                            className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow position-absolute top-0 end-0 m-2'
                            onClick={(e) => {
                                e.stopPropagation()
                                onUploaded('')
                            }}
                        >
                            <i className='bi bi-x fs-2'></i>
                        </button>
                    </div>
                ) : (
                    <div className='text-center'>
                        {uploading ? (
                            <div className='spinner-border text-primary' role='status'>
                                <span className='visually-hidden'>Loading...</span>
                            </div>
                        ) : (
                            <>
                                <i className='bi bi-image fs-3x text-muted mb-2'></i>
                                <div className='text-muted fs-7'>
                                    {intl.formatMessage({ id: 'JOURNEYS.STEP.UPLOAD_DESC', defaultMessage: 'Click to upload image' })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>
            {error && <div className="text-danger mt-2">{error}</div>}
        </div>
    )
}
