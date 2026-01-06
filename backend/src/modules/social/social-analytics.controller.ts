import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SocialAnalyticsService } from './social-analytics.service';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { UserEntity } from '../../users/user.entity';

@Controller('social/analytics')
@UseGuards(JwtAccessGuard)
export class SocialAnalyticsController {
    constructor(private readonly analyticsService: SocialAnalyticsService) { }

    @Get('dashboard')
    async getDashboard(@Req() req: { user: UserEntity }) {
        // Check ADMIN permissions here
        return this.analyticsService.getDashboardStats(req.user.companyId);
    }

    @Get('heatmap')
    async getHeatmap(@Req() req: { user: UserEntity }) {
        return this.analyticsService.getHeatmap(req.user.companyId);
    }

    @Get('wordcloud')
    async getWordCloud(@Req() req: { user: UserEntity }) {
        return this.analyticsService.getWordCloud(req.user.companyId);
    }
    @Get('leaderboard')
    async getLeaderboard(@Req() req: { user: UserEntity }) {
        return this.analyticsService.getLeaderboardUsers(req.user.companyId);
    }

    @Get('leaderboard/groups')
    async getGroupLeaderboard(@Req() req: { user: UserEntity }) {
        return this.analyticsService.getLeaderboardGroups(req.user.companyId);
    }

    @Get('posts')
    async getPostsPerformance(@Req() req: { user: UserEntity }) {
        return this.analyticsService.getPostPerformance(req.user.companyId);
    }
}
