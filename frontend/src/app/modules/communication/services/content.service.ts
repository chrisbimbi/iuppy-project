// src/app/modules/communication/services/content.service.ts
import { api } from '../../../api'
import { News, CreateNewsDto, UpdateNewsDto } from '@shared/types'
import { getAuth } from 'src/app/modules/auth/core/AuthHelpers'

type CreatePayload = Omit<CreateNewsDto, 'companyId' | 'authorId'>
type UpdatePayload = Omit<UpdateNewsDto, 'companyId' | 'authorId'>

// opcional/defensivo: injeta o Bearer se por algum motivo não estiver no interceptor
function withAuth() {
  const auth = getAuth()
  return auth?.api_token
    ? { headers: { Authorization: `Bearer ${auth.api_token}` } }
    : undefined
}

export const ContentService = {
  create(dto: CreatePayload): Promise<News> {
    const { settings, ...rest } = dto as any
    const { authorId: _drop, ...safeSettings } = settings || {}
    return api.post<News>('/news', { ...rest, settings: safeSettings }, withAuth()).then(r => r.data)
  },

  update(id: string, dto: UpdatePayload): Promise<News> {
    const { settings, ...rest } = dto as any
    const { authorId: _drop, ...safeSettings } = settings || {}
    return api.put<News>(`/news/${id}`, { ...rest, settings: safeSettings }, withAuth()).then(r => r.data)
  },

  list(channelId?: string | null): Promise<News[]> {
    return api.get<News | News[]>('/news', { params: channelId ? { channelId } : {} })
      .then(r => Array.isArray(r.data) ? r.data : [r.data]);
  },

  get(id: string): Promise<News> {
    return api.get<News>(`/news/${id}`).then(r => r.data)
  },

  remove(id: string): Promise<void> {
    return api.delete(`/news/${id}`, withAuth()).then(() => {})
  },

  async countByChannel(channelId: string): Promise<number> {
    const items = await this.list(channelId)
    return items.length
  },

  async getLatestByChannel(channelId: string): Promise<News | null> {
    const items = await this.list(channelId)
    if (!items.length) return null
    items.sort(
      (a, b) =>
        new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
    )
    return items[0]
  },
}