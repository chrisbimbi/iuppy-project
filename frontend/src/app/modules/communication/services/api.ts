import { api } from '../../../api'
import { News, CreateNewsDto, UpdateNewsDto, NewsSettings } from '@shared/types'

// No frontend NÃO mandaremos companyId/authorId
export type CreateNewsPayload = Omit<CreateNewsDto, 'companyId' | 'authorId'> & {
    // garantimos os obrigatórios que o backend realmente usa
    channelId: string
    title: string
    content: string
    settings: NewsSettings
}

export type UpdateNewsPayload = Omit<UpdateNewsDto, 'companyId' | 'authorId'>

export const ContentApi = {
    list(channelId?: string | null): Promise<News[]> {
        return api.get<News[]>('/news', { params: channelId ? { channelId } : {} }).then(r => r.data)
    },

    get(id: string): Promise<News> {
        return api.get<News>(`/news/${id}`).then(r => r.data)
    },

    create(dto: CreateNewsPayload): Promise<News> {
        return api.post<News>('/news', dto).then(r => r.data)
    },

    update(id: string, dto: UpdateNewsPayload): Promise<News> {
        return api.put<News>(`/news/${id}`, dto).then(r => r.data)
    },

    remove(id: string): Promise<void> {
        return api.delete(`/news/${id}`).then(() => { })
    },

    // helpers
    async countByChannel(channelId: string): Promise<number> {
        const items = await this.list(channelId)
        return items.length
    },

    async getLatestByChannel(channelId: string): Promise<News | null> {
        const items = await this.list(channelId)
        if (items.length === 0) return null
        items.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
        return items[0]
    },
}