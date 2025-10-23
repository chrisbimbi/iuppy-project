// frontend/src/app/modules/analytics/services/analytics.service.ts
import { api } from 'src/app/api'

/** ============================================================================
 *  Tipos "clássicos" (mantidos para compatibilidade com áreas antigas do CMS)
 *  ============================================================================ */
export type NewsOverviewDTO = {
  period: { from: string | null; to: string | null }
  scope: { spaceId?: string; channelId?: string; groupId?: string }
  totals: {
    publishedCount: number
    recebiveis: number
    opens: number
    uniqueOpens: number
    acks: number
    reactions: number
    comments: number
    shares: number
  }
  rates: {
    avgOpenRate: number
    avgAckRate: number
    avgReactionRate: number
    avgCommentRate: number
    avgShareRate: number
  }
}

export type NewsDetailAnalyticsDTO = {
  id: string
  recebivel: number
  recebeuPush?: number
  totalOpens: number
  uniqueOpens: number
  acks: number
  reactionsTotal: number
  comments: { total: number; pending: number; approved: number; rejected: number }
  sharesTotal: number
  reactionsByType: Record<string, number>
  seriesDaily: Array<{ date: string; uniqueOpens?: number; acks?: number; reactions?: number; comments?: number; shares?: number }>
  heatmap: Array<{ hour: number; dow: number; count: number }>
  latencies?: {
    sentToDeliveredMs?: { p50?: number; p95?: number; avg?: number }
    sentToOpenMs?: { p50?: number; p95?: number; avg?: number }
  }
}

export type NewsMetricsBulkDTO = Record<
  string,
  {
    recebivel: number
    recebeuPush?: number
    totalOpens?: number
    uniqueOpens?: number
    acks?: number
    reactionsTotal: number
    commentsTotal: number
    sharesTotal: number
    openRate?: number
    ackRate?: number
  }
>

export type UsersOverviewDTO = {
  totals: {
    base: number
    withAppOrToken: number
    active: number
    engaged: number
  }
  rates: {
    appInstallRate: number
    activityRate: number
    engagementRate: number
  }
}

/** ============================================================================
 *  Novos tipos para o Overview "flat" (lista + série agregada)
 *  ============================================================================ */
export type NewsOverviewItem = {
  id: string
  title: string | null
  channelId: string
  spaceId?: string | null
  createdAt: string
  /** Flags úteis para a tabela (exibição) */
  published?: boolean
  pushSent?: boolean
  /** Ajudantes vindos do backend */
  publishedAt?: string | null
  isPublished?: boolean | null
  status?: string | null
  /**
   * Alguns backends devolvem as flags dentro de `settings`.
   * Usamos apenas `pushNotification` quando vier.
   */
  settings?: { pushNotification?: boolean | number | string }
  metrics: {
    /** Visitas (eventos OPEN total, sem DISTINCT) */
    open: number
    /** Visitantes (unique OPEN) — pode vir ausente em algumas instalações */
    unique?: number
    /** ACKs (usuários) */
    ack: number
    /** Likes/Reações (eventos) */
    reactions: number
    /** Comentários (eventos) */
    comments: number
    /** Shares (eventos) */
    shares: number
    /** Base recebível (auxiliar) */
    base?: number
  }
}

export type NewsOverviewSeriesPoint = {
  date: string
  opens?: number
  uniqueOpens?: number
  reactions?: number
  comments?: number
  shares?: number
  posts?: number
}

export type NewsOverviewResponse = {
  /** KPIs consolidados (ex.: 30 dias) */
  openRate30d: number
  ackRate30d: number
  reactionsPerBase: number
  totalInteractions: number

  /** Lista (paginada) para News List */
  items: NewsOverviewItem[]
  total: number
  page: number
  pageSize: number

  /** Série agregada para "News Activity" (do backend) */
  seriesDaily?: NewsOverviewSeriesPoint[]

  /**
   * Totais agregados opcionais (podem não vir em todos os clientes)
   * Mantido para compat com UIs que exibem soma rápida no topo.
   */
  totals?: {
    posts?: number
    opens?: number
    uniqueOpens?: number
    reactions?: number
    comments?: number
    shares?: number
  }

  /** Métrica de latência de push (opcional) */
  pushLatency?: {
    cdf: Array<{ x: number; y: number }>
    histogram: Array<{ label: string; count: number }>
    summary: { p50?: number | null; p90?: number | null; avg?: number | null }
  }
}

/** Sorts aceitos pelo backend */
export type OverviewSortBy =
  | 'createdAt'
  | 'open'
  | 'unique'
  | 'ack'
  | 'reactions'
  | 'comments'
  | 'shares'
  | 'title'

export type OverviewSortDir = 'asc' | 'desc'

export const AnalyticsService = {
  // ===== Overview de notícias (lista + KPIs + série agregada) =====
  async newsOverview(params: {
    from: string
    to: string
    spaceId?: string
    channelId?: string
    groupId?: string
    excludeDeleted?: boolean
    sortBy?: OverviewSortBy
    sortDir?: OverviewSortDir
    page?: number
    pageSize?: number
  }): Promise<NewsOverviewResponse> {
    const r = await api.get<NewsOverviewResponse>('/v2/analytics/news/overview', { params })
    return r.data
  },

  // Detalhes analíticos de uma notícia (período aplicado)
  async getNewsDetail(id: string, params: { from: string; to: string }): Promise<NewsDetailAnalyticsDTO> {
    const r = await api.get<NewsDetailAnalyticsDTO>(`/v2/analytics/news/${id}`, { params })
    return r.data
  },

  // Métrica bulk para cards/listas
  async getNewsMetrics(ids: string[], params: { from: string; to: string }): Promise<NewsMetricsBulkDTO> {
    const r = await api.get<NewsMetricsBulkDTO>('/v2/analytics/news/metrics', {
      params: { ...params, ids: ids.join(',') },
    })
    return r.data
  },

  // Visão geral de usuários
  async getUsersOverview(params: { from: string; to: string; spaceId?: string; channelId?: string; groupId?: string }): Promise<UsersOverviewDTO> {
    const r = await api.get<UsersOverviewDTO>('/v2/analytics/users/overview', { params })
    return r.data
  },
}