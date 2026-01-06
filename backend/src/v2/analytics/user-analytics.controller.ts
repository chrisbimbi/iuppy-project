import { Controller, Get, UseGuards, Request, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserAnalyticsService } from './user-analytics.service';

@Controller('v2/analytics/users')
@UseGuards(AuthGuard('jwt'))
export class UserAnalyticsController {
  constructor(private readonly userAnalyticsService: UserAnalyticsService) {}

  @Get('overview')
  async getOverview(@Request() req: { user: { companyId: string } }) {
    const companyId = req.user.companyId;
    return this.userAnalyticsService.getOverview(companyId);
  }

  @Get('export')
  async export(
    @Request() req: { user: { companyId: string } },
    @Res() res: Response,
  ) {
    const companyId = req.user.companyId;
    const csv = await this.userAnalyticsService.exportTimeSeries(companyId);

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename="user_activity.csv"',
    );
    res.send(csv);
  }
}
