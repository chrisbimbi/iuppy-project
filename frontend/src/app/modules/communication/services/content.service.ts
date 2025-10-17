// src/app/modules/communication/services/content.service.ts
import { api } from 'src/app/api'
import { News, CreateNewsDto, UpdateNewsDto } from '@shared/types'

// Não enviaremos companyId/authorId (backend deriva do token)
type CreatePayload = Omit<CreateNewsDto, 'companyId' | 'authorId'>
type UpdatePayload = Omit<UpdateNewsDto, 'companyId' | 'authorId'>

export const ContentService = {
  create(dto: CreatePayload): Promise<News> {
    const { settings, ...rest } = dto as any
    const { authorId: _dropA, companyId: _dropC, ...safeSettings } = settings || {}
    return api.post<News>('/news', { ...rest, settings: safeSettings }).then(r => r.data)
  },

  update(id: string, dto: UpdatePayload & { authorId?: string; companyId?: string }): Promise<News> {
    const { settings, authorId: _a, companyId: _c, ...rest } = dto as any
    const { authorId: _dropA, companyId: _dropC, ...safeSettings } = settings || {}
    return api.put<News>(`/news/${id}`, { ...rest, settings: safeSettings }).then(r => r.data)
  },

  list(channelId?: string | null): Promise<News[]> {
    return api.get<News[]>('/news', { params: channelId ? { channelId } : {} }).then(r => r.data)
  },

  get(id: string): Promise<News> {
    return api.get<News>(`/news/${id}`).then(r => r.data)
  },

  remove(id: string): Promise<void> {
    return api.delete(`/news/${id}`).then(() => { })
  },

  async countByChannel(channelId: string): Promise<number> {
    const items = await this.list(channelId); return items.length
  },

  async getLatestByChannel(channelId: string): Promise<News | null> {
    const items = await this.list(channelId)
    if (!items.length) return null
    items.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
    return items[0]
  },

  // ✅ FINAL: batch de métricas para lista do CMS (corrigido endpoint/shape)
  async batchMetrics(ids: string[], from?: string, to?: string): Promise<Record<string, any>> {
    if (!ids.length) return {}
    const params: any = { ids: ids.join(',') }
    if (from) params.from = from
    if (to) params.to = to
    // /v2/news/metrics retorna um objeto plano { [newsId]: {...} }
    const r = await api.get<Record<string, any>>('/v2/news/metrics', { params })
    return r.data || {}
  },

  // (opcional) helper pra detalhe, se quiser padronizar as chamadas:
  async getMetrics(newsId: string, from?: string, to?: string) {
    const r = await api.get(`/v2/news/${newsId}/metrics`, { params: { from, to } })
    return r.data
  },
}