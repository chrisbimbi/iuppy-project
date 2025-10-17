// frontend/src/app/modules/communication/providers/useContentActions.ts
import { useCallback } from 'react'
import { ContentService } from '../services/content.service'
import {
  CreateNewsDto as CreateContentDto,
  UpdateNewsDto as UpdateContentDto,
  News,
} from '@shared/types'

export const useContentActions = (refetch: () => void) => {
  const createItem = useCallback(
    async (dto: CreateContentDto): Promise<News> => {
      const created = await ContentService.create(dto)
      refetch()
      return created
    },
    [refetch]
  )

  const editItem = useCallback(
    async (id: string, dto: UpdateContentDto): Promise<News> => {
      const updated = await ContentService.update(id, dto)
      refetch()
      return updated
    },
    [refetch]
  )


  const duplicateItem = useCallback(
    async (id: string) => {
      const original: News = await ContentService.get(id)

      const attachments = (original.attachments ?? [])
        .filter(url => url)
        .map(url => ({ url, name: url.split('/').pop()! }))

      const highlightImages = (original.highlightImages ?? [])
        .filter(url => url)
        .map(url => ({ url, name: url.split('/').pop()! }))

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
      }

      await ContentService.create(dto)
      refetch()
    },
    [refetch]
  )

  const deleteItem = useCallback(
    async (id: string) => {
      await ContentService.remove(id)
      refetch()
    },
    [refetch]
  )

  const togglePublishItems = useCallback(
    async (ids: string[]) => {
      await Promise.all(
        ids.map(async id => {
          const original: News = await ContentService.get(id)
          const dto: UpdateContentDto = {
            title: original.title,
            subtitle: original.subtitle,
            content: original.content,
            type: original.type,
            channelId: original.channelId,
            authorId: original.authorId,
            companyId: original.companyId!,
            isPublished: !original.isPublished,
            attachments: (original.attachments ?? [])
              .filter(url => url)
              .map(url => ({ url, name: url.split('/').pop()! })),
            highlightImages: (original.highlightImages ?? [])
              .filter(url => url)
              .map(url => ({ url, name: url.split('/').pop()!, altText: '' })),
            settings: { ...original.settings },
          }
          await ContentService.update(id, dto)
        })
      )
      refetch()
    },
    [refetch]
  )

  return {
    createItem,
    editItem,
    duplicateItem,
    deleteItem,
    togglePublishItems,
  }
}