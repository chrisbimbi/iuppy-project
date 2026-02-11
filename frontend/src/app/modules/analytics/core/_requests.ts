import { api } from '../../../api'


const API_URL = 'analytics/dashboard'

export interface DashboardStatsResponse {
    activeModules: string[]
    stats: {
        users: {
            totalUsers: number // Now represents Registered (All) or Activated? I mapped total->Registered in Service.
            registeredUsers: number
            activatedUsers: number
            activeUsers: number
            engagedUsers: number
            turnoverRate?: number
            turnoverCost?: number
            evolution: Array<{
                month: string
                total: number
                registered: number
                active: number
                engaged: number
            }>
            heatmap?: Array<{
                dow: number
                hour: number
                count: number
            }>
            topConnected?: Array<{
                id: string
                name: string
                role?: string
                avatar?: string
                xp: number
                color?: string
            }>
        }
        social?: {
            totalPosts: number
            totalInteractions: number
            engagementRate: number
            topGroups: Array<{ groupName: string, count: number }>
            bottomGroups: Array<{ groupName: string, count: number }>
            topPosters: Array<{
                userId: string
                name: string
                avatar: string
                posts: number
                interactions: number
            }>
        }
        socialLeaderboard?: Array<{ // Legacy? or used by widget?
            userId: string
            name?: string
            avatar?: string
            totalInteractions: number
        }>
        nr1?: { // Standardize NR1 structure if needed, keeping legacy for now to avoid breaking Nr1Widget unless updated
            risks: { total: number, high: number, medium: number, low: number }
            training: { total: number, completed: number, overdue: number, completionRate: number }
            drills: { total: number, participated: number }
            eSocial: { pendingEvents: number, lastSync: string | null }
            documents: number
            checklists: number
        }
        forms?: {
            totalForms: number
            totalSubmissions: number
            onTimeRate: number
            trend: Array<{ date: string; submissions: number }>
        }
        surveys?: {
            totalPolls: number
            totalResponses: number
            avgParticipationPercent: number
            recentPolls: Array<{
                id: string
                title: string
                status: string
                responses: number
                createdAt: string
            }>
        }
        gamification?: {
            totalXP: number
            avgXP: number
        }
        gamificationRanking?: Array<{
            userId: string
            xp: number
            rank: number
            user: { name: string; avatar: string }
        }>
        news?: {
            totalNews: number
            totalReads: number
            openRate: number
            items?: any[]
            heatmap: Array<{
                day: number
                hour: number
                count: number
            }>
            heatmapViews?: Array<{
                day: number
                hour: number
                count: number
            }>
            heatmapEngagement?: Array<{
                day: number
                hour: number
                count: number
            }>
            channelEffectiveness: Array<{
                channelName: string
                newsCount: number
                uniqueOpens: number
                avgOpensPerNews: number
            }>
            channels?: any[] // Legacy fallback
        }
        vacations?: {
            totalRequests: number
            pendingRequests: number
            approvedRequests: number
            awayNow: number
            riskDistribution: { ok: number, warning: number, critical: number }
            financialLiability: number
            // Legacy for compatibility if widget used old props
            pendingCount?: number
            whoIsOutList?: any[]
        }
        performance?: {
            activeCycles: number
            totalGoals: number
            nineBoxDistribution: Record<string, number>
        }
        journeys?: {
            activeJourneys: number
            totalInstances: number
            startedInstances?: number
            completedInstances: number
            advancing: number
            behind: number
            avgCompletionPercent: number
            avgVideoViews: number
            topJourneys: Array<{
                id: string
                title: string
                enrollments: number
            }>
        }
    }
}

export interface SearchAnalyticsResponse {
    totalSearches: number
    uniqueUsers: number
    avgTookMs: number | null
    topQueries: Array<{ q: string; count: number }>
    zeroResultQueries: Array<{ q: string; count: number }>
}

export function getDashboardStats() {
    return api.get<DashboardStatsResponse>(API_URL)
}

export function getSearchAnalytics(from?: string, to?: string) {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    return api.get<SearchAnalyticsResponse>(`v2/search/overview?${params.toString()}`)
}

export interface ReadingBehaviorResponse {
    totalOpens: number
    uniqueReaders: number
    avgDurationMs: number | null
    buckets: {
        glanced: number
        skimmed: number
        read: number
    }
    noDuration: number
}

export function getReadingBehavior(from?: string, to?: string, newsId?: string) {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (newsId) params.append('newsId', newsId)
    return api.get<ReadingBehaviorResponse>(`v2/analytics/content/reading-behavior?${params.toString()}`)
}

export interface TrafficSourcesResponse {
    totalOpens: number
    sources: Array<{
        source: string
        count: number
        uniqueUsers: number
        percentage: number
    }>
    campaigns: Array<{
        campaign: string
        source: string
        medium: string
        count: number
        uniqueUsers: number
    }>
}

export function getTrafficSources(from?: string, to?: string, newsId?: string) {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (newsId) params.append('newsId', newsId)
    return api.get<TrafficSourcesResponse>(`v2/analytics/content/traffic-sources?${params.toString()}`)
}

export interface ChatBehaviorResponse {
    totalMessages: number
    activeUsers: number
    activeConversations: number
    conversationTypes: {
        group: number
        direct: number
        groupMessages: number
        directMessages: number
    }
    messageTypes: {
        text: number
        image: number
        voice: number
        file: number
    }
    avgResponseTimeMinutes: number | null
    topMessengers: Array<{
        userId: string
        userName: string
        messageCount: number
        conversationCount: number
        lastMessageAt: string
    }>
    dailyVolume: Array<{
        date: string
        count: number
    }>
    lowActivityUsers: Array<{
        userId: string
        userName: string
        messageCount: number
        lastMessageAt: string | null
        daysSinceLastMessage: number | null
    }>
    insights: {
        churnRisk: number
        engagementRate: number
    }
}

export function getChatBehavior(from?: string, to?: string, userId?: string) {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (userId) params.append('userId', userId)
    return api.get<ChatBehaviorResponse>(`v2/analytics/chat/behavior?${params.toString()}`)
}

export interface EngagementFunnelResponse {
    from: string | null
    to: string | null
    segmentType: string
    overall: {
        registered: number
        activated: number
        engaged: number
        activationRate: number
        engagementRate: number
    }
    segments: Array<{
        segment: string
        registered: number
        activated: number
        engaged: number
        activationRate: number
        engagementRate: number
    }>
    topPerformers: Array<any>
}

export function getEngagementFunnel(from?: string, to?: string, segment?: 'department' | 'jobTitle' | 'location') {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (segment) params.append('segment', segment)
    return api.get<EngagementFunnelResponse>(`v2/analytics/funnel/engagement?${params.toString()}`)
}
