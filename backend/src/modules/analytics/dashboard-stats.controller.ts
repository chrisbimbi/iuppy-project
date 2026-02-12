import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyModulesService } from '../../modules/company-modules/company-modules.service';
import { UsersService } from '../../users/users.service';
import { SocialAnalyticsService } from '../../modules/social/social-analytics.service';
import { Nr1AnalyticsService } from '../../modules/nr1/services/nr1-analytics.service';
import { FormsAnalyticsService } from '../../modules/forms/analytics/forms-analytics.service';
import { GamificationAnalyticsService } from '../../modules/gamification/gamification-analytics.service';
import { NewsService } from '../../news/news.service';
import { VacationsService } from '../../modules/vacations/vacations.service';
import { PerformanceService } from '../../modules/performance/performance.service';
import { JourneysService } from '../../modules/journeys/journeys.service';

import { AnalyticsV2Service } from '../../v2/analytics/analytics.service';

import { SurveysService } from '../../modules/surveys/surveys.service';

@Controller('analytics/dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardStatsController {
    constructor(
        private readonly companyModulesService: CompanyModulesService,
        private readonly usersService: UsersService,
        private readonly socialAnalyticsService: SocialAnalyticsService,
        private readonly nr1AnalyticsService: Nr1AnalyticsService,
        private readonly formsAnalyticsService: FormsAnalyticsService,
        private readonly surveysService: SurveysService, // ADDED
        private readonly gamificationAnalyticsService: GamificationAnalyticsService,
        private readonly newsService: NewsService,
        private readonly vacationsService: VacationsService,
        private readonly performanceService: PerformanceService,
        private readonly journeysService: JourneysService,
        private readonly analyticsV2Service: AnalyticsV2Service,
    ) { }



    @Get()
    async getDashboardStats(@Req() req) {
        const companyId = req.user.companyId;

        // Determine active modules
        const modules = await this.companyModulesService.list(companyId);
        const activeModules = modules.filter(m => m.enabled).map(m => m.key);

        // Parallel executions
        const promises: any = {};

        // 1. USERS (Switch to V2 for accurate Active/Engaged separation)
        // Also fetch Turnover Stats from UsersService (Phase 4)
        promises.turnover = this.usersService.getTurnoverStats(companyId).catch(() => null);

        promises.users = this.analyticsV2Service.usersOverview(companyId, { from: null, to: null })
            .then(v2Stats => ({
                totalUsers: v2Stats.users.total,
                registeredUsers: v2Stats.users.registered,
                activatedUsers: v2Stats.users.activated,
                activeUsers: v2Stats.users.active,
                engagementRate: v2Stats.users.engagedRate,
                activeRate: v2Stats.users.activeRate,
                activationRate: v2Stats.users.activationRate,
                turnoverRate: v2Stats.users.turnoverRate, // Will be overridden if needed or used as fallback
                turnoverCost: v2Stats.users.turnoverCost,
                // Map V2 activity series to evolution graph expected by frontend
                evolution: (v2Stats.activitySeries || []).map(s => ({
                    month: s.date, // Frontend likely expects 'YYYY-MM', check formatting needs
                    total: s.total, // Now using Activated as total for charts
                    registered: s.registered,
                    active: s.active,
                    engaged: s.engaged
                })),
                topConnected: v2Stats.topConnected || [],
                heatmap: v2Stats.heatmap || []
            }))
            .catch(err => {
                console.error('Error fetching User V2 stats:', err);
                return null;
            });

        // 2. NEWS (Switch to V2 for rich interaction data)
        if (activeModules.includes('news')) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            promises.news = Promise.all([
                this.analyticsV2Service.newsOverview(companyId, {
                    page: 1,
                    pageSize: 5,
                    from: thirtyDaysAgo.toISOString(), // Force 30 days for heatmap and items
                    to: new Date().toISOString()
                }),
                this.analyticsV2Service.getChannelEffectiveness(companyId)
            ])
                .then(([v2News, channelStats]) => ({
                    totalNews: v2News.total,
                    totalReads: v2News.totalInteractions, // Or sums of opens/uniqueOpens if preferred
                    openRate: v2News.openRate30d,
                    items: v2News.items,
                    heatmap: v2News.heatmap, // ADDED: Pass heatmap data to frontend
                    heatmapViews: v2News.heatmapViews,
                    heatmapEngagement: v2News.heatmapEngagement,
                    channelEffectiveness: channelStats
                }))
                .catch(err => {
                    console.error('Error fetching News V2 stats:', err);
                    return null;
                });
        }

        // --- EXISTING V1 MODULES (Keep as is) ---

        if (activeModules.includes('social')) {
            promises.social = this.socialAnalyticsService.getDashboardStats(companyId).catch(() => null);
        }

        if (activeModules.includes('nr1')) {
            promises.nr1 = this.nr1AnalyticsService.getDashboardStats(companyId).catch(() => null);
        }

        if (activeModules.includes('forms')) {
            promises.forms = this.formsAnalyticsService.getDashboardSummary(companyId).catch(() => null);
        }

        if (activeModules.includes('surveys') || activeModules.includes('polls' as any)) {
            promises.surveys = this.surveysService.getDashboardStats(companyId).catch(err => {
                console.error('Error fetching Surveys stats:', err);
                return null;
            });
        }

        if (activeModules.includes('gamification')) {
            promises.gamification = this.gamificationAnalyticsService.getOverview(companyId).catch(() => null);
            promises.gamificationRanking = this.gamificationAnalyticsService.getRanking(companyId, 5)
                .then(users => users.map((u, i) => ({
                    userId: u.userId,
                    xp: u.xp,
                    rank: i + 1,
                    user: {
                        name: u.name,
                        avatar: u.avatarUrl
                    }
                })))
                .catch(() => []);
        }

        if (activeModules.includes('vacations')) {
            promises.vacations = this.vacationsService.getDashboardStats(companyId).catch(() => null);
        }

        if (activeModules.includes('performance')) {
            promises.performance = this.performanceService.getDashboardStats(companyId).catch(() => null);
        }

        if (activeModules.includes('journeys')) {
            promises.journeys = this.journeysService.getDashboardStats(companyId).catch(() => null);
        }

        // Wait for all
        const keys = Object.keys(promises);
        const results = await Promise.all(Object.values(promises));

        const response: any = {
            activeModules,
            stats: {},
        };

        keys.forEach((key, index) => {
            if (key === 'turnover') return; // Handled separately
            response.stats[key] = results[index];
        });

        // Merge Turnover Stats into Users Stats
        const turnoverIndex = keys.indexOf('turnover');
        if (turnoverIndex !== -1 && results[turnoverIndex]) {
            if (!response.stats.users) response.stats.users = {};
            // Override with fresh data
            response.stats.users.turnoverStats = results[turnoverIndex];
            // Also override the rate if available
            response.stats.users.turnoverRate = results[turnoverIndex].rate;
        }

        return response;
    }
}
