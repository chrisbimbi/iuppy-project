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

/** Remove campos não aceitos pelo backend (class-validator com forbidNonWhitelisted). */
function sanitizeSettings(input: any) {
  const {
    // não pertencem a settings
    authorId: _dropA,
    companyId: _dropC,

    // 🎯 novos campos de audiência (não suportados no backend atual)
    audienceMode: _dropAudMode,
    audienceSnapshot: _dropAudSnap,
    audienceSpaceId: _dropSpaceId,
    audienceChannelIds: _dropChannelIds,
    audienceGroupIds: _dropGroupIds,

    ...rest
  } = input || {}
  return rest
}

export const ContentApi = {
  list(channelId?: string | null): Promise<News[]> {
    return api.get<News[]>('/news', { params: channelId ? { channelId } : {} }).then(r => r.data)
  },

  get(id: string): Promise<News> {
    return api.get<News>(`/news/${id}`).then(r => r.data)
  },

  create(dto: CreateNewsPayload): Promise<News> {
    const { settings, ...rest } = dto as any
    const safeSettings = sanitizeSettings(settings)
    return api.post<News>('/news', { ...rest, settings: safeSettings }).then(r => r.data)
  },

  update(id: string, dto: UpdateNewsPayload): Promise<News> {
    const { settings, ...rest } = dto as any
    const safeSettings = sanitizeSettings(settings)
    return api.put<News>(`/news/${id}`, { ...rest, settings: safeSettings }).then(r => r.data)
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
