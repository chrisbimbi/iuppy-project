// frontend/src/app/modules/communication/providers/useContentActions.ts
import { useCallback } from 'react';
import { ContentService } from '../services/content.service';
import {
    CreateNewsDto as CreateContentDto,
    UpdateNewsDto as UpdateContentDto,
    News,
} from '@shared/types';

export const useContentActions = (refetch: () => void) => {
    const createItem = useCallback(
        async (dto: CreateContentDto) => {
            await ContentService.create(dto);
            refetch();
        },
        [refetch]
    );

    const editItem = useCallback(
        async (id: string, dto: UpdateContentDto) => {
            await ContentService.update(id, dto);
            refetch();
        },
        [refetch]
    );

    const duplicateItem = useCallback(
        async (id: string) => {
            const original: News = await ContentService.get(id);

            // Mapeia os attachments e highlightImages para {url, name}
            const attachments = original.attachments.map(url => ({
                url,
                name: url.split('/').pop() || url,
            }));
            const highlightImages = original.highlightImages.map(url => ({
                url,
                name: url.split('/').pop() || url,
            }));

            const dto: CreateContentDto = {
                title: original.title + ' (Cópia)',
                subtitle: original.subtitle,
                content: original.content,
                type: original.type,
                authorId: original.authorId,
                companyId: original.companyId!,
                channelId: original.channelId,
                isPublished: false,
                attachments,
                highlightImages,
                settings: { ...original.settings },
            };

            await ContentService.create(dto);
            refetch();
        },
        [refetch]
    );

    const deleteItem = useCallback(
        async (id: string) => {
            await ContentService.remove(id);
            refetch();
        },
        [refetch]
    );

    return { createItem, editItem, duplicateItem, deleteItem };
};