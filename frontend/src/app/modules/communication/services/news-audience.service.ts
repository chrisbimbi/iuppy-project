import { api } from 'src/app/api'
import { AudienceMode } from '@shared/types/NewsSettings'

export type AudienceProbeResponse = {
  totalUsuarios: number
  comTokenAtivo: number
  mode: AudienceMode
  identifiers: Record<string, any>
}

export type AudienceSelectionDto = {
  mode: AudienceMode
  groupIds?: string[]
  spaceId?: string
  channelIds?: string[]
}

export type UnopenedUserRow = {
  id: string
  name?: string | null
  email?: string | null
}

function normalizeProbeResponse(
  raw: any,
  fallbackMode: AudienceMode,
  idents: Record<string, any>
): AudienceProbeResponse {
  const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  return {
    totalUsuarios: n(raw?.totalUsuarios ?? raw?.total ?? raw?.count ?? raw?.base ?? raw?.totalUsers ?? 0),
    comTokenAtivo: n(raw?.comTokenAtivo ?? raw?.recebiveis ?? raw?.deliverable ?? raw?.withToken ?? raw?.pushable ?? 0),
    mode: (raw?.mode as AudienceMode) || fallbackMode,
    identifiers: { ...(raw?.identifiers ?? {}), ...idents },
  }
}

function normalizeUnopenedList(raw: any): UnopenedUserRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((it: any): UnopenedUserRow | null => {
      if (typeof it === 'string') return { id: it }
      const id = String(it?.id ?? it?.userId ?? it?.user_id ?? '').trim()
      if (!id) return null
      return {
        id,
        name: it?.name ?? it?.userName ?? it?.displayName ?? null,
        email: it?.email ?? it?.userEmail ?? null,
      }
    })
    .filter(Boolean) as UnopenedUserRow[]
}

export const NewsAudienceService = {
  async applyAudience(newsId: string, selection: AudienceSelectionDto) {
    return api.post(`/v2/news/${newsId}/audience/apply`, selection).then((r) => r.data)
  },

  async probeForNews(newsId: string, selection: AudienceSelectionDto): Promise<AudienceProbeResponse> {
    return api
      .post(`/v2/news/${newsId}/audience/probe`, selection)
      .then((r) => normalizeProbeResponse(r.data, selection.mode, { newsId, ...selection }))
  },

  async probeForDraft(selection: AudienceSelectionDto): Promise<AudienceProbeResponse> {
    return api
      .post(`/v2/audience/probe`, selection)
      .then((r) => normalizeProbeResponse(r.data, selection.mode, { ...selection }))
  },

  async getChannel(channelId: string) {
    return api.get(`/v2/channels/${channelId}`).then((r) => r.data)
  },

  /**
   * Lista de usuários elegíveis que **não abriram** a notícia.
   * Endpoints suportados (fallback em cascata) — prioriza /news direto:
   */
  async getUnopenedUsers(newsId: string): Promise<UnopenedUserRow[]> {
    const tryPaths = [
      `/news/${newsId}/unopened-users`,
      `/v2/news/${newsId}/unopened-users`,
      `/news/${newsId}/audience/unopened`,
      `/v2/news/${newsId}/audience/unopened`,
      `/news/${newsId}/unopened`,
      `/v2/news/${newsId}/unopened`,
    ]
    let lastErr: any
    for (const p of tryPaths) {
      try {
        const res = await api.get(p)
        return normalizeUnopenedList(res.data)
      } catch (e) {
        lastErr = e
      }
    }
    throw lastErr
  },

  /**
   * Reenvia push para quem **não abriu**.
   * Endpoints suportados (fallback em cascata) — prioriza /news direto:
   */
  async resendToUnopened(
    newsId: string,
    payload?: { pushTitle?: string; pushContent?: string }
  ): Promise<{ sent?: number } | any> {
    const tryPaths = [
      `/news/${newsId}/resend`,
      `/v2/news/${newsId}/notifications/resend-unopened`,
      `/v2/news/${newsId}/push/resend-unopened`,
      `/v2/news/${newsId}/resend-unopened`,
      `/news/${newsId}/resend-unopened`,
    ]
    let lastErr: any
    for (const p of tryPaths) {
      try {
        const res = await api.post(p, payload ?? {})
        return res.data
      } catch (e) {
        lastErr = e
      }
    }
    throw lastErr
  },
}