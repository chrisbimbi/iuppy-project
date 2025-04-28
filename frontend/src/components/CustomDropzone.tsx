import React, { useCallback } from 'react';
import { useDropzone, Accept } from 'react-dropzone';
import { KTSVG } from '../helpers';

interface CustomDropzoneProps {
    onFilesAdded: (files: File[]) => void;
    accept?: Accept;
    maxFiles?: number;
    maxSize?: number;
    type: 'highlightImages' | 'attachments';
    multiple?: boolean;
}

const CustomDropzone: React.FC<CustomDropzoneProps> = ({ onFilesAdded, accept, maxFiles, maxSize, type, multiple = true }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      //  console.log('Dropzone accepted files:', acceptedFiles);
        onFilesAdded(acceptedFiles);
    }, [onFilesAdded]);

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        accept,
        maxFiles,
        maxSize,
        multiple,
    });

    //console.log('Dropzone current accepted files:', acceptedFiles);

    return (
        <div>
            <div {...getRootProps()} className={`custom-dropzone ${isDragActive ? 'custom-dropzone-active' : ''}`}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <div className="text-primary">
                        <KTSVG path='../media/icons/duotune/files/fil008.svg' className='svg-icon-3x mb-5' />
                        <h3 className="text-primary">Solte os arquivos aqui</h3>
                    </div>
                ) : (
                    <div>
                        <KTSVG path='../media/icons/duotune/files/fil008.svg' className='svg-icon-3x mb-5' />
                        <h3>{type === 'highlightImages' ? 'Anexar imagens de destaque' : 'Anexar arquivos'}</h3>
                    </div>
                )}
            </div>
            {acceptedFiles.length > 0 && (
                <div className="mt-5">
                    <h4>{type === 'highlightImages' ? 'Imagens Selecionadas:' : 'Anexos selecionados:'}:</h4>
                    <ul>
                        {acceptedFiles.map((file: File) => (
                            <li key={file.name}>{file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomDropzone;