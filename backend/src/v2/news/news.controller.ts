// src/v2/news/news.controller.ts
import { Controller, Get, Post, Param, Body, Req, UseGuards, Query, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewsV2Service } from './news.service';
import type { ReactionKind } from '@shared/types/v2/interactions';
import { AnalyticsV2Service } from '../analytics/analytics.service';
import { MetricsDailyServiceV2 } from '../metrics/metrics-daily.service';

type V2ShareChannel = 'app' | 'email' | 'whatsapp' | 'telegram';

class OpenDto { meta?: Record<string, any>; }
class AckDto { }
class ReactDto { reaction!: ReactionKind; }
class CommentDto { text!: string; }
class ShareDto { channel?: V2ShareChannel; meta?: Record<string, any>; }

@UseGuards(AuthGuard('jwt'))
@Controller('v2/news')
export class NewsV2Controller {
  constructor(
    private readonly news: NewsV2Service,
    private readonly analytics: AnalyticsV2Service,
    @Optional() private readonly metricsDaily?: MetricsDailyServiceV2,
  ) {}

  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.detail(companyId, id, userId);
  }

  @Post(':id/audience/snapshot')
  async snapshot(@Param('id') id: string, @Query('companyWide') companyWide: string | undefined, @Req() req: any) {
    const companyId = req.user.companyId;
    const cw = companyWide === 'true' || companyWide === '1';
    return this.news.snapshotAudience(companyId, id, { companyWide: cw });
  }

  @Get(':id/metrics')
  async metrics(@Param('id') id: string, @Query('from') from: string | undefined, @Query('to') to: string | undefined, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.analytics.newsMetrics(companyId, id, from, to);
  }

  @Post(':id/open')
  async open(@Param('id') id: string, @Body() body: OpenDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    const res = await this.news.open(companyId, id, userId, body?.meta);
    // best-effort para métrica, sem quebrar fluxo se o serviço não existir
    if (this.metricsDaily?.onEvent) this.metricsDaily.onEvent(companyId, id, userId, 'OPEN');
    return res;
  }

  @Post(':id/ack')
  async ack(@Param('id') id: string, @Body() _body: AckDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    const res = await this.news.ack(companyId, id, userId);
    if (this.metricsDaily?.onEvent) this.metricsDaily.onEvent(companyId, id, userId, 'ACK');
    return res;
  }

  @Post(':id/react')
  async react(@Param('id') id: string, @Body() body: ReactDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    const res = await this.news.react(companyId, id, userId, body.reaction);
    if (this.metricsDaily?.onEvent) this.metricsDaily.onEvent(companyId, id, userId, 'REACT');
    return res;
  }

  @Post(':id/comments')
  async comment(@Param('id') id: string, @Body() body: CommentDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    const res = await this.news.comment(companyId, id, userId, body.text);
    if (this.metricsDaily?.onEvent) this.metricsDaily.onEvent(companyId, id, userId, 'COMMENT');
    return res;
  }

  @Post(':id/share')
  async share(@Param('id') id: string, @Body() body: ShareDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    const res = await this.news.share(companyId, id, userId, body?.channel, body?.meta);
    if (this.metricsDaily?.onEvent) this.metricsDaily.onEvent(companyId, id, userId, 'SHARE');
    return res;
  }
}