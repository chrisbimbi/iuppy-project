import React, { useState } from 'react';
import { Accept } from 'react-dropzone';
import { getCroppedSquare } from './imageCrop/getCroppedImg';
import { UploadsService } from '../services/uploads.service';
import CustomDropzone from 'src/components/CustomDropzone';

type Props = {
    value?: string;                 // logoUrl atual
    onUploaded: (url: string) => void; // callback ao subir com sucesso
};

const imageAccept: Accept = { 'image/*': ['.jpeg', '.jpg', '.png'] };

export const LogoUploader: React.FC<Props> = ({ value, onUploaded }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFiles = async (files: File[]) => {
        if (!files?.length) return;
        setError(null);
        setBusy(true);
        try {
            // crop quadrado (512px) e salva PNG
            const cropped = await getCroppedSquare(files[0], 512);
            const url = await UploadsService.uploadLogo(cropped);
            onUploaded(url);
        } catch (e: any) {
            setError('Falha ao processar/enviar a imagem. Tente outra.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="d-flex align-items-center gap-4">
            <div
                className="bg-light d-flex align-items-center justify-content-center"
                style={{
                    width: 96, height: 96, borderRadius: 16,
                    overflow: 'hidden', border: '1px dashed var(--bs-gray-400)',
                }}
            >
                {value ? (
                    <img
                        src={value}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
                    />
                ) : (
                    <span className="text-gray-500">96×96</span>
                )}
            </div>

            <div style={{ minWidth: 260 }}>
                <CustomDropzone
                    onFilesAdded={handleFiles}
                    accept={imageAccept}
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024}
                    type="attachments"
                    multiple={false}
                />
                <div className="form-text">PNG/JPG até 5MB. O app usa recorte quadrado.</div>
                {busy && <div className="text-muted mt-2">Enviando...</div>}
                {error && <div className="text-danger mt-2">{error}</div>}
            </div>
        </div>
    );
};

export default LogoUploader;