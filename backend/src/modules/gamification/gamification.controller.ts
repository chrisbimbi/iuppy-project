import { Controller, Get, Post, Put, Query, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { GamificationService } from './gamification.service';
import { GamificationAnalyticsService } from './gamification-analytics.service';
import { GamificationSettingsService } from './gamification-settings.service';
import { GamificationActionType } from './entities/user-xp-history.entity';
import { GamificationExplanationEntity } from './entities/gamification-explanation.entity';
import { UserEntity } from '../../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Role } from '@shared/types';
import { Roles, RolesGuard } from '../../common/guards/roles.guard';

@Controller('gamification')
@UseGuards(JwtAccessGuard)
export class GamificationController {
    constructor(
        private readonly gamificationService: GamificationService,
        private readonly analyticsService: GamificationAnalyticsService,
        private readonly settingsService: GamificationSettingsService,
        @InjectRepository(GamificationExplanationEntity)
        private readonly explanationRepo: Repository<GamificationExplanationEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
    ) { }

    @Get('stats')
    async getMyStats(@Req() req) {
        return this.gamificationService.getUserStats(req.user.id);
    }

    @Get('history')
    async getMyHistory(@Req() req, @Query('limit') limit = 20) {
        return this.gamificationService.getHistory(req.user.id, limit);
    }

    @Post('manual-award')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async manualAward(@Body() body: { userIds: string[], amount: number, description: string }, @Req() req) {
        const { userIds, amount, description } = body;

        if (!userIds || userIds.length === 0) return { count: 0 };

        const results = [];
        for (const userId of userIds) {
            try {
                // TODO: Verify if user belongs to same company as admin (Security)
                // For now assuming Admin can only see users of their company in frontend selection.

                await this.gamificationService.awardXP(
                    userId,
                    amount,
                    GamificationActionType.MANUAL_AWARD,
                    req.user.id, // Source = Admin ID
                    description,
                    { awardedBy: req.user.name }
                );
                results.push({ userId, status: 'ok' });
            } catch (e) {
                results.push({ userId, status: 'error', error: e.message });
            }
        }
        return { results };
    }

    @Get('leaderboard')
    async getLeaderboard(@Req() req, @Query('limit') limit = 10) {
        return this.gamificationService.getLeaderboard(req.user.companyId, limit);
    }

    @Get('badges')
    async getBadges(@Req() req) {
        return this.gamificationService.getAllBadgesWithUserStatus(req.user.id);
    }

    // === ANALYTICS ENDPOINTS (Admin Only) ===

    @Get('analytics/overview')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getAnalyticsOverview(@Req() req) {
        return this.analyticsService.getOverview(req.user.companyId);
    }

    @Get('analytics/ranking')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getAnalyticsRanking(@Req() req, @Query('limit') limit = 10) {
        return this.analyticsService.getRanking(req.user.companyId, Number(limit));
    }

    @Get('analytics/heatmap')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getAnalyticsHeatmap(
        @Req() req,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        return this.analyticsService.getHeatmap(req.user.companyId, fromDate, toDate);
    }

    @Get('analytics/by-action-type')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getAnalyticsByActionType(
        @Req() req,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        return this.analyticsService.getByActionType(req.user.companyId, fromDate, toDate);
    }

    @Get('analytics/user/:userId/history')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getUserHistory(@Req() req, @Query('userId') userId: string, @Query('limit') limit = 50) {
        // TODO: Verify user belongs to same company
        return this.analyticsService.getUserHistory(userId, Number(limit));
    }

    // === SETTINGS ENDPOINTS (Admin Only) ===

    @Get('settings')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getSettings(@Req() req) {
        return this.settingsService.getSettings(req.user.companyId);
    }

    @Put('settings')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async updateSettings(@Req() req, @Body() rules: any) {
        return this.settingsService.updateSettings(req.user.companyId, rules);
    }

    // === EXPLANATION TEXT ENDPOINTS (Admin Only) ===

    @Get('explanation')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async getExplanation(@Req() req) {
        const explanation = await this.explanationRepo.findOne({
            where: { companyId: req.user.companyId }
        });
        return { content: explanation?.content || null };
    }

    @Put('explanation')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async updateExplanation(@Req() req, @Body() body: { content: string }) {
        let explanation = await this.explanationRepo.findOne({
            where: { companyId: req.user.companyId }
        });

        if (!explanation) {
            explanation = this.explanationRepo.create({
                companyId: req.user.companyId,
                content: body.content,
            });
        } else {
            explanation.content = body.content;
            explanation.updatedAt = new Date();
        }

        await this.explanationRepo.save(explanation);
        return { content: explanation.content };
    }

    // === USER SEARCH ENDPOINT (Admin Only) ===

    @Get('users/search')
    @UseGuards(RolesGuard)
    @Roles(Role.CompanyAdmin, Role.HRAdmin)
    async searchUsers(@Req() req, @Query('q') query: string) {
        if (!query || query.length < 2) {
            return [];
        }

        const users = await this.userRepo.find({
            where: [
                { companyId: req.user.companyId, name: Like(`%${query}%`) },
                { companyId: req.user.companyId, email: Like(`%${query}%`) },
            ],
            take: 10,
            select: ['id', 'name', 'email', 'avatarUrl', 'xp'],
        });

        return users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
            xp: u.xp,
            level: this.gamificationService.getLevelFromXP(u.xp),
        }));
    }
}

