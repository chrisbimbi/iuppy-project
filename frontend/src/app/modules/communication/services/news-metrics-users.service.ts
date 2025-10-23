// src/app/modules/communication/services/news-metrics-users.service.ts
import { api } from 'src/app/api'

export type ActionKind = 'opened' | 'acknowledged' | 'reacted' | 'commented' | 'shared'

export type UserActionRow = {
  id: string
  name?: string | null
  email?: string | null
  openCount?: number
  ackCount?: number
  reactionCount?: number
  commentCount?: number
  shareCount?: number
}

export type UsersQuery = {
  from?: string
  to?: string
  limit?: number
  offset?: number
  q?: string
}

export type UsersResponse = {
  items: UserActionRow[]
  total?: number
  hasMore?: boolean
}

function normalizeUser(row: any): UserActionRow {
  const id = String(row?.id ?? row?.userId ?? '').trim()
  return {
    id,
    name: row?.name ?? row?.userName ?? row?.displayName ?? null,
    email: row?.email ?? row?.userEmail ?? null,
    openCount: Number(row?.openCount ?? row?.opens ?? row?.opensCount ?? 0) || undefined,
    ackCount: Number(row?.ackCount ?? row?.acks ?? row?.acksCount ?? 0) || undefined,
    reactionCount: Number(row?.reactionCount ?? row?.reactions ?? row?.reactionsCount ?? 0) || undefined,
    commentCount: Number(row?.commentCount ?? row?.comments ?? row?.commentsCount ?? 0) || undefined,
    shareCount: Number(row?.shareCount ?? row?.shares ?? row?.sharesCount ?? 0) || undefined,
  }
}

async function getWithFallback<T = any>(paths: string[], params: any): Promise<T> {
  let lastErr: any
  for (const p of paths) {
    try {
      const res = await api.get(p, { params })
      return res.data as T
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

export const NewsMetricsUsersService = {
  async list(newsId: string, kind: ActionKind, query: UsersQuery = {}): Promise<UsersResponse> {
    const base = `/v2/news/${newsId}/users/${kind}`
    const fallback = `/news/${newsId}/users/${kind}`
    const payload = await getWithFallback<any>([base, fallback], {
      from: query.from, to: query.to, limit: query.limit ?? 50, offset: query.offset ?? 0, q: query.q ?? '',
    })
    // suporta tanto {items,total} quanto array simples
    const items: any[] = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : [])
    const total: number | undefined = Number.isFinite(payload?.total) ? Number(payload.total) : undefined
    const hasMore: boolean | undefined = typeof payload?.hasMore === 'boolean' ? payload.hasMore : undefined
    return {
      items: items.map(normalizeUser),
      total,
      hasMore,
    }
  },

  async listAll(newsId: string, kind: ActionKind, query: UsersQuery = {}, maxRecords = 5000): Promise<UserActionRow[]> {
    const out: UserActionRow[] = []
    let offset = 0
    const limit = Math.min(200, query.limit ?? 200)
    // 1a chamada pra pegar total (se o backend fornece)
    const head = await this.list(newsId, kind, { ...query, limit: 1, offset: 0 })
    const expected = head.total && head.total > 0 ? head.total : undefined
    if (expected && expected > maxRecords) {
      // evita baixas gigantescas sem pedir
      throw new Error('DATASET_TOO_LARGE')
    }
    // paginação
    for (;;) {
      const page = await this.list(newsId, kind, { ...query, limit, offset })
      out.push(...page.items)
      if (page.items.length < limit) break
      offset += limit
      if (out.length >= maxRecords) break
    }
    return out
  },

  /** União (únicos) de usuários que interagiram = reacted ∪ commented ∪ shared */
  async listInteractionsAll(newsId: string, query: UsersQuery = {}, maxRecords = 5000): Promise<UserActionRow[]> {
    const [reacted, commented, shared] = await Promise.all([
      this.listAll(newsId, 'reacted', query, maxRecords).catch(() => []),
      this.listAll(newsId, 'commented', query, maxRecords).catch(() => []),
      this.listAll(newsId, 'shared', query, maxRecords).catch(() => []),
    ])
    const map = new Map<string, UserActionRow>()
    const acc = (rows: UserActionRow[], kind: 'reactionCount' | 'commentCount' | 'shareCount') => {
      for (const r of rows) {
        const prev = map.get(r.id) || { id: r.id, name: r.name, email: r.email }
        map.set(r.id, { ...prev, [kind]: (prev as any)[kind] ? Number((prev as any)[kind]) + (r as any)[kind]! : (r as any)[kind] })
      }
    }
    acc(reacted, 'reactionCount')
    acc(commented, 'commentCount')
    acc(shared, 'shareCount')
    return Array.from(map.values())
  },

  async interactionsUniqueCount(newsId: string, query: UsersQuery = {}, threshold = 5000): Promise<number | null> {
    // tentativa rápida: ler somente totals
    try {
      const [r, c, s] = await Promise.all([
        this.list(newsId, 'reacted', { ...query, limit: 1, offset: 0 }),
        this.list(newsId, 'commented', { ...query, limit: 1, offset: 0 }),
        this.list(newsId, 'shared', { ...query, limit: 1, offset: 0 }),
      ])
      const approx = (r.total ?? 0) + (c.total ?? 0) + (s.total ?? 0)
      if (approx <= threshold) {
        const all = await this.listInteractionsAll(newsId, query, threshold)
        return all.length
      }
      // muito grande -> sem custo, retorna null (frontend pode cair para total de eventos)
      return null
    } catch {
      return null
    }
  },
}