import React, { useCallback, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import axios from 'axios'
import { useIntl } from 'react-intl'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type Props = {
    value?: string | null
    onUploaded: (url: string) => void
}

type Area = { x: number; y: number; width: number; height: number }

async function getCroppedBlob(imageSrc: string, cropAreaPixels: Area): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageSrc
    })

    const canvas = document.createElement('canvas')
    canvas.width = cropAreaPixels.width
    canvas.height = cropAreaPixels.height
    const ctx = canvas.getContext('2d')!

    ctx.drawImage(
        image,
        cropAreaPixels.x,
        cropAreaPixels.y,
        cropAreaPixels.width,
        cropAreaPixels.height,
        0,
        0,
        cropAreaPixels.width,
        cropAreaPixels.height
    )

    return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.92)
    })
}

const LogoUploader: React.FC<Props> = ({ value, onUploaded }) => {
    const intl = useIntl()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [localUrl, setLocalUrl] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null)
        const f = e.target.files?.[0]
        if (!f) return
        const url = URL.createObjectURL(f)
        setLocalUrl(url)
    }

    const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
        setCroppedAreaPixels(areaPixels)
    }, [])

    const handleUpload = async () => {
        if (!localUrl || !croppedAreaPixels) return
        setUploading(true)
        setError(null)
        try {
            const blob = await getCroppedBlob(localUrl, croppedAreaPixels)

            const file = new File([blob], 'logo.png', { type: 'image/png' })
            const fd = new FormData()
            fd.append('file', file)

            const { data } = await axios.post<{ url: string }>(`${API_URL}/uploads/logo`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            })

            onUploaded(data.url)
            setLocalUrl(null)
            if (inputRef.current) inputRef.current.value = ''
        } catch (e: any) {
            setError(intl.formatMessage({ id: 'COMPANY.LOGO_UPLOADER.ERROR', defaultMessage: 'Falha no upload. Tente novamente.' }))
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <div className="d-flex align-items-center gap-3">
                <div
                    className="rounded"
                    style={{
                        width: 72, height: 72, overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,.1)', borderRadius: 12,
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {(localUrl || value) ? (
                        <img
                            src={localUrl || value!}
                            alt="logo"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <span className="text-muted">72×72</span>
                    )}
                </div>

                <div className="d-flex flex-column">
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                        >
                            {intl.formatMessage({ id: 'COMPANY.LOGO_UPLOADER.BUTTON.SELECT', defaultMessage: 'Selecionar imagem' })}
                        </button>
                        {localUrl && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? intl.formatMessage({ id: 'COMPANY.LOGO_UPLOADER.BUTTON.UPLOADING', defaultMessage: 'Enviando…' }) : intl.formatMessage({ id: 'COMPANY.LOGO_UPLOADER.BUTTON.SAVE', defaultMessage: 'Salvar logo' })}
                            </button>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={onSelectFile}
                    />
                    {error && <div className="text-danger mt-2">{error}</div>}
                </div>
            </div>

            {/* Modal leve “inline” para crop */}
            {localUrl && (
                <div className="border rounded-3 mt-4" style={{ position: 'relative', width: '100%', height: 280 }}>
                    <Cropper
                        image={localUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="rect"
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        showGrid={false}
                        restrictPosition={true}
                    />
                    <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-white bg-opacity-75">
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="form-range"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default LogoUploader