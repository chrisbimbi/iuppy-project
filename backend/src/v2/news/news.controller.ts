import { Controller, Get, Post, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewsV2Service } from './news.service';
import type { ReactionType } from '@shared/types/v2/interactions';
import { AnalyticsV2Service } from '../analytics/analytics.service';

type V2ShareChannel = 'app' | 'email' | 'whatsapp' | 'telegram';

class OpenDto { meta?: Record<string, any>; }
class AckDto { }
class ReactDto { reaction!: ReactionType; }
class CommentDto { text!: string; }
class ShareDto { channel?: V2ShareChannel; meta?: Record<string, any>; }

@UseGuards(AuthGuard('jwt'))
@Controller('v2/news')
export class NewsV2Controller {
  constructor(
    private readonly news: NewsV2Service,
    private readonly analytics: AnalyticsV2Service,
  ) { }

  @Get(':id')
  async detail(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.detail(companyId, id, userId);
  }

  // NOVO: /v2/news/:id/metrics
  @Get(':id/metrics')
  async metrics(@Param('id') id: string, @Query('from') from: string | undefined, @Query('to') to: string | undefined, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.analytics.newsMetrics(companyId, id, from, to);
  }

  @Post(':id/open')
  async open(@Param('id') id: string, @Body() body: OpenDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.open(companyId, id, userId, body?.meta);
  }

  @Post(':id/ack')
  async ack(@Param('id') id: string, @Body() _body: AckDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.ack(companyId, id, userId);
  }

  @Post(':id/react')
  async react(@Param('id') id: string, @Body() body: ReactDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.react(companyId, id, userId, body.reaction);
  }

  @Post(':id/comments')
  async comment(@Param('id') id: string, @Body() body: CommentDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.comment(companyId, id, userId, body.text);
  }

  @Post(':id/share')
  async share(@Param('id') id: string, @Body() body: ShareDto, @Req() req: any) {
    const companyId = req.user.companyId;
    const userId = req.user.id || req.user.sub;
    return this.news.share(companyId, id, userId, body?.channel, body?.meta);
  }
}