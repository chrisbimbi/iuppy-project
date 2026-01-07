export interface GamificationAnalyticsOverview {
    totalXPDistributed: number;
    activeUsers: number; // Users who gained XP in last 30 days
    averageXPPerUser: number;
    totalActions: number;
}

export interface GamificationRankingUser {
    userId: string;
    name: string;
    displayName?: string;
    avatarUrl?: string;
    xp: number;
    level: number;
}

export interface GamificationHeatmapDay {
    date: string; // YYYY-MM-DD
    xp: number;
    actions: number;
}

export interface GamificationActionTypeDistribution {
    actionType: string;
    xp: number;
    count: number;
    percentage: number;
}

export interface UserXPHistoryItem {
    id: string;
    amount: number;
    actionType: string;
    description: string;
    createdAt: Date | string;
}
