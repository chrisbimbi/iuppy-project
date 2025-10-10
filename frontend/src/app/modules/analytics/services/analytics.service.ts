// src/app/modules/analytics/services/analytics.service.ts
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

export const AnalyticsService = {
  async newsOverview(params: { from: string; to: string; spaceId?: string; channelId?: string; groupId?: string }): Promise<NewsOverviewDTO> {
    const r = await api.get<NewsOverviewDTO>('/v2/analytics/news/overview', { params })
    return r.data
  },
}