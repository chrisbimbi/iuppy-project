import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { AnalyticsV2Service } from './analytics.service';

@ApiTags('Analytics V2')
@ApiBearerAuth('bearer')
@Controller('v2/analytics')
@UseGuards(JwtAccessGuard)
export class AnalyticsV2Controller {
  constructor(private readonly svc: AnalyticsV2Service) {}

  // Alias pedido: /v2/analytics/news/:id
  @Get('news/:id')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'tz', required: false, type: String })
  async newsMetricsAlias(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string, @Req() req?: any) {
    const companyId = req.user.companyId;
    return this.svc.newsMetrics(companyId, id, from, to);
  }

  // Overview da empresa: /v2/analytics/news/overview
  @Get('news/overview')
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'tz', required: false, type: String })
  async overview(@Query('from') from?: string, @Query('to') to?: string, @Req() req?: any) {
    const companyId = req.user.companyId;
    return this.svc.overview(companyId, from, to);
  }
}