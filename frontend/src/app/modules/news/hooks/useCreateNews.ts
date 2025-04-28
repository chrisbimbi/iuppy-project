// src/app/modules/news/hooks/useCreateNews.ts
import { useState } from 'react';
import { FormikHelpers } from 'formik';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '../../../../utils/sanitizeHtml';
import { simulateFileUpload } from '../../../../utils/fileUtils';
import { CreateNewsDto } from '@shared/types';
import { NewsService } from '../services/news.service';

export const useCreateNews = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (
    values: CreateNewsDto,
    { setSubmitting }: FormikHelpers<CreateNewsDto>
  ) => {
    console.log('[useCreateNews] handleSubmit iniciado', values);
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.authorId)) {
        values.authorId = uuidv4();
        console.log('[useCreateNews] authorId gerado:', values.authorId);
      }
      const sanitizedValues = {
        ...values,
        content: sanitizeHtml(values.content),
      };
      console.log('[useCreateNews] valores sanitizados:', sanitizedValues);

      // upload de arquivos...
      // (mantém seus logs de progresso padrão)

      console.log('[useCreateNews] enviando para backend:', JSON.stringify(sanitizedValues, null, 2));
      const response = await NewsService.createNew(sanitizedValues);
      console.log('[useCreateNews] resposta do backend:', response);

      return response;
    } catch (err: any) {
      console.error('[useCreateNews] Erro ao criar new:', err);
      setError(err.message || 'Erro ao criar new.');
      throw err;
    } finally {
      setLoading(false);
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return { handleSubmit, loading, error, uploadProgress };
};
