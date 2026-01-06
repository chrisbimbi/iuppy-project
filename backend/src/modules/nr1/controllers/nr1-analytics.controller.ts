import {
    Controller,
    Get,
    Res,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAccessGuard } from '../../../auth/guards/jwt-access.guard';
import { AuthenticatedRequest } from '../../../common/types/authenticated-request.interface';
import { Nr1AnalyticsService } from '../services/nr1-analytics.service';

@Controller('nr1/analytics')
export class Nr1AnalyticsController {
    constructor(private readonly analyticsService: Nr1AnalyticsService) { }

    @Get('dashboard')
    @UseGuards(JwtAccessGuard)
    async getDashboard(@Req() req: AuthenticatedRequest) {
        return this.analyticsService.getDashboardStats(req.user.companyId);
    }

    @Get('export')
    @UseGuards(JwtAccessGuard)
    async exportData(@Req() req: AuthenticatedRequest, @Res() res: Response) {
        const csv = await this.analyticsService.exportAllData(req.user.companyId);

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="nr1_export.csv"');
        res.send(csv);
    }
}
