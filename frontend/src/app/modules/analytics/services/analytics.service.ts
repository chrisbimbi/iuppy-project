import { api } from 'src/app/api'

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
  totalOpens: number
  uniqueOpens: number
  acks: number
  reactionsTotal: number
  comments: { total: number; pending: number; approved: number; rejected: number }
  sharesTotal: number
  reactionsByType: Record<string, number>
  seriesDaily: Array<{ date: string; uniqueOpens?: number; acks?: number; reactions?: number; comments?: number; shares?: number }>
  heatmap: Array<{ hour: number; dow: number; count: number }>
  latencies?: { sentToDeliveredMs?: { p50?: number; p95?: number; avg?: number }; sentToOpenMs?: { p50?: number; p95?: number; avg?: number } }
}

export type NewsMetricsBulkDTO = Record<
  string,
  {
    recebivel: number
    uniqueOpens: number
    acks: number
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

export const AnalyticsService = {
  async newsOverview(params: { from: string; to: string; spaceId?: string; channelId?: string; groupId?: string }): Promise<NewsOverviewDTO> {
    const r = await api.get<NewsOverviewDTO>('/v2/analytics/news/overview', { params })
    return r.data
  },

  // NOVO: detalhes analíticos de uma notícia (período aplicado)
  async getNewsDetail(id: string, params: { from: string; to: string }): Promise<NewsDetailAnalyticsDTO> {
    const r = await api.get<NewsDetailAnalyticsDTO>(`/v2/analytics/news/${id}`, { params })
    return r.data
  },

  // NOVO: métrica bulk para cards/listas
  async getNewsMetrics(ids: string[], params: { from: string; to: string }): Promise<NewsMetricsBulkDTO> {
    const r = await api.get<NewsMetricsBulkDTO>('/v2/analytics/news/metrics', {
      params: { ...params, ids: ids.join(',') },
    })
    return r.data
  },

  // NOVO: visão geral de usuários
  async getUsersOverview(params: { from: string; to: string }): Promise<UsersOverviewDTO> {
    const r = await api.get<UsersOverviewDTO>('/v2/analytics/users/overview', { params })
    return r.data
  },
}
