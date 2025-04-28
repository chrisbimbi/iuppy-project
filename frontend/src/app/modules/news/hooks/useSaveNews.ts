// src/app/modules/news/hooks/useSaveNews.ts
import { useState } from 'react';
import { FormikHelpers } from 'formik';
import { CreateNewsDto, UpdateNewsDto } from '@shared/types';
import { NewsService } from '../services/news.service';

export const useSaveNews = (editingId?: string) => {
    const [loading, setLoading] = useState(false);

    const save = async (
        createDto: CreateNewsDto,
        updateDto: UpdateNewsDto,
        helpers: FormikHelpers<CreateNewsDto>
    ) => {
        setLoading(true);
        try {
            if (editingId) {
                await NewsService.updateNew(editingId, updateDto);
            } else {
                await NewsService.createNew(createDto);
            }
            helpers.resetForm();
        } catch (error) {
            console.error('[useSaveNews] error saving news:', error);
            throw error;
        } finally {
            setLoading(false);
            helpers.setSubmitting(false);
        }
    };

    return { save, loading };
};
