import { useState } from 'react';
import { FormikHelpers } from 'formik';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '../../../../utils/sanitizeHtml';
import { simulateFileUpload } from '../../../../utils/fileUtils';
import { CreateNewsDto } from '@shared/types';
import { NewsService } from '../services/news.service';

export const useCreateNew = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSubmit = async (values: CreateNewsDto, { setSubmitting }: FormikHelpers<CreateNewsDto>) => {
        setLoading(true);
        setError(null);
        setUploadProgress(0);
        try {
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.authorId)) {
                values.authorId = uuidv4();
            }
            const sanitizedValues = {
                ...values,
                content: sanitizeHtml(values.content)
            };
            const totalFiles = (values.highlightImages?.length || 0) + (values.attachments?.length || 0);
            let uploadedFiles = 0;
            const updateProgress = () => {
                if (totalFiles > 0) {
                    setUploadProgress((uploadedFiles / totalFiles) * 100);
                } else {
                    setUploadProgress(100);
                }
            };
            const highlightImageUrls = await Promise.all(
                (values.highlightImages || []).map(async (file: any, index) => {
                    const result = await simulateFileUpload(
                        file instanceof File ? file : new File([file], `file-${index}`),
                        'highlightImage'
                    );
                    uploadedFiles++;
                    updateProgress();
                    return { url: result, name: file.name || `file-${index}` };
                })
            );
            const attachmentUrls = await Promise.all(
                (values.attachments || []).map(async (file: any, index) => {
                    const result = await simulateFileUpload(
                        file instanceof File ? file : new File([file], `file-${index}`),
                        'attachment'
                    );
                    uploadedFiles++;
                    updateProgress();
                    return { url: result, name: file.name || `file-${index}` };
                })
            );
            const newToSave = {
                ...sanitizedValues,
                highlightImages: highlightImageUrls,
                attachments: attachmentUrls,
            };
            if (newToSave.settings.schedulePublishDate) {
                newToSave.isPublished = false;
            }
            console.log('Dados sendo enviados para o backend:', JSON.stringify(newToSave, null, 2));
            const response = await NewsService.createNew(newToSave);
            console.log('New criado com sucesso:', response);
            return response;
        } catch (err: any) {
            console.error('Erro ao criar new:', err);
            setError(err.message || 'Erro ao criar new. Por favor, tente novamente.');
            throw err;
        } finally {
            setLoading(false);
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    return { handleSubmit, loading, error, uploadProgress };
};
