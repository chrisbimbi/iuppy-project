import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request.interface';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get('analytics/top-terms')
    @UseGuards(JwtAccessGuard)
    async getTopTerms(
        @Req() req: AuthenticatedRequest,
        @Query('days') days?: string,
        @Query('limit') limit?: string,
    ) {
        const user = req.user;
        return await this.searchService.getTopTerms(
            user.companyId,
            days ? Number(days) : 30,
            limit ? Number(limit) : 10,
        );
    }

    @Get('analytics/no-results')
    @UseGuards(JwtAccessGuard)
    async getNoResultsTerms(
        @Req() req: AuthenticatedRequest,
        @Query('days') days?: string,
        @Query('limit') limit?: string,
    ) {
        const user = req.user;
        return await this.searchService.getNoResultsTerms(
            user.companyId,
            days ? Number(days) : 30,
            limit ? Number(limit) : 10,
        );
    }

    @Get()
    @UseGuards(JwtAccessGuard)
    async search(
        @Req() req: AuthenticatedRequest,
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        const user = req.user;
        return await this.searchService.search(
            user.companyId,
            query,
            limit ? Number(limit) : 20,
            user.sub || user.id,
        );
    }
}
