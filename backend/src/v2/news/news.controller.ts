import { Response } from 'express';
import { createHash } from 'crypto';
import {
  Controller,
  Res,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
  Optional,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewsV2Service, UserState } from './news.service';
import { AnalyticsV2Service } from '../analytics/analytics.service';
import { MetricsDailyServiceV2 } from '../metrics/metrics-daily.service';

type V2ShareChannel = 'app' | 'email' | 'whatsapp' | 'telegram';

const REACTIONS = ['like', 'love', 'clap', 'smile', 'neutral', 'angry'] as const;
type ReactionType = (typeof REACTIONS)[number];

function normalizeReaction(v: unknown): ReactionType {
  const r = String(v ?? '').trim().toLowerCase();
  if (!r) throw new BadRequestException('reaction is required');
  if (!REACTIONS.includes(r as ReactionType)) {
    throw new BadRequestException(
      `invalid reaction. allowed: ${REACTIONS.join(', ')}`,
    );
  }
  return r as ReactionType;
}

@UseGuards(AuthGuard('jwt'))
@Controller('v2/news')
export class NewsV2Controller {
  constructor(
    private readonly news: NewsV2Service,
    private readonly analytics: AnalyticsV2Service,
    @Optional() private readonly metricsDaily?: MetricsDailyServiceV2,
  ) { }

  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;

    const data = await this.news.detail(companyId, id, userId);

    // ETag incluindo estado do usuário + métricas
    const etagPayload = {
      id: data.id,
      updatedAt: data.updatedAt ?? null,
      metrics: data.metrics ?? null,
      user: {
        opened: data.userState?.opened ?? false,
        openedAt: data.userState?.openedAt ?? null,
        acknowledged: data.userState?.acknowledged ?? false,
        acknowledgedAt: data.userState?.acknowledgedAt ?? null,
        myReaction: data.userState?.myReaction ?? null,
        myComments: data.userState?.myComments ?? 0,
      },
    };
    const hash = createHash('sha1')
      .update(JSON.stringify(etagPayload))
      .digest('hex')
      .slice(0, 32);
    const etag = `W/"${hash}"`;

    // A resposta depende do usuário => variar por Authorization
    res.setHeader('Vary', 'Authorization');
    res.setHeader('ETag', etag);

    const ifNoneMatch =
      (req.headers['if-none-match'] as string | undefined) ??
      (req.headers['If-None-Match'] as string | undefined);

    if (ifNoneMatch && ifNoneMatch === etag) {
      res.status(304);
      return;
    }

    return data;
  }

  /** Métricas batch para cards/listas */
  @Get('metrics')
  async batchMetrics(
    @Query('ids') idsStr: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId as string;
    const ids = (idsStr ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) throw new BadRequestException('ids is required');

    const data = await this.analytics.batchNewsMetrics(companyId, ids, from, to);

    const payload = { ids, from: from ?? null, to: to ?? null, data };
    const hash = createHash('sha1')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 32);
    const etag = `W/"${hash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Authorization');

    const ifNoneMatch =
      (req.headers['if-none-match'] as string | undefined) ??
      (req.headers['If-None-Match'] as string | undefined);
    if (ifNoneMatch && ifNoneMatch === etag) {
      res.status(304);
      return;
    }

    return data;
  }

  @Get(':id/comments')
  async listComments(
    @Param('id') id: string,
    @Query('limit') limitStr: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId as string;
    const limit = Math.max(1, Math.min(100, Number(limitStr ?? 50)));
    return this.news.listComments(companyId, id, { limit, cursor });
  }

  @Post(':id/audience/snapshot')
  async snapshot(
    @Param('id') id: string,
    @Query('companyWide') companyWide: string | undefined,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId as string;
    const cw = companyWide === 'true' || companyWide === '1';
    return this.news.snapshotAudience(companyId, id, { companyWide: cw });
  }

  @Get(':id/metrics')
  async metrics(
    @Param('id') id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId as string;
    const data = await this.analytics.newsMetrics(companyId, id, from, to);

    const payload = { id, from: from ?? null, to: to ?? null, data };
    const hash = createHash('sha1')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 32);
    const etag = `W/"${hash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Authorization');

    const ifNoneMatch =
      (req.headers['if-none-match'] as string | undefined) ??
      (req.headers['If-None-Match'] as string | undefined);
    if (ifNoneMatch && ifNoneMatch === etag) {
      res.status(304);
      return;
    }
    return data;
  }

  @Post(':id/open')
  async open(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;

    const result = await this.news.open(companyId, id, userId, body?.meta);

    if (this.metricsDaily?.onEvent) {
      this.metricsDaily.onEvent(companyId, id, userId, 'OPEN');
    }

    res.setHeader('Vary', 'Authorization');

    // ETag parcial só com estado do user
    const etagPayload = {
      id,
      user: {
        opened: result.userState.opened,
        openedAt: result.userState.openedAt,
        acknowledged: result.userState.acknowledged,
        acknowledgedAt: result.userState.acknowledgedAt,
      } as UserState,
    };
    const hash = createHash('sha1')
      .update(JSON.stringify(etagPayload))
      .digest('hex')
      .slice(0, 32);
    const etag = `W/"${hash}"`;
    res.setHeader('ETag', etag);

    res.status(201);
    return result;
  }

  @Post(':id/ack')
  async ack(
    @Param('id') id: string,
    @Body() _body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;

    const result = await this.news.ack(companyId, id, userId);

    if (this.metricsDaily?.onEvent) {
      this.metricsDaily.onEvent(companyId, id, userId, 'ACK');
    }

    res.setHeader('Vary', 'Authorization');

    const etagPayload = {
      id,
      user: {
        opened: result.userState.opened,
        openedAt: result.userState.openedAt,
        acknowledged: result.userState.acknowledged,
        acknowledgedAt: result.userState.acknowledgedAt,
      } as UserState,
    };
    const hash = createHash('sha1')
      .update(JSON.stringify(etagPayload))
      .digest('hex')
      .slice(0, 32);
    const etag = `W/"${hash}"`;
    res.setHeader('ETag', etag);

    res.status(201);
    return result;
  }

  @Post(':id/react')
  async react(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;
    const reaction = normalizeReaction(body?.reaction);
    const res = await this.news.react(companyId, id, userId, reaction);
    if (this.metricsDaily?.onEvent)
      this.metricsDaily.onEvent(companyId, id, userId, 'REACT');
    return res;
  }

  @Post(':id/unreact')
  async unreact(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;
    const res = await this.news.unreact(companyId, id, userId);
    if (this.metricsDaily?.onEvent)
      this.metricsDaily.onEvent(companyId, id, userId, 'REACT');
    return res;
  }

  @Post(':id/comments')
  async comment(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;
    const text = String(body?.text ?? '').trim();
    if (!text) throw new BadRequestException('text is required');

    const res = await this.news.comment(companyId, id, userId, text);
    if (this.metricsDaily?.onEvent)
      this.metricsDaily.onEvent(companyId, id, userId, 'COMMENT');
    return res;
  }

  @Post(':id/share')
  async share(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;
    const channel = body?.channel as V2ShareChannel | undefined;
    const res = await this.news.share(companyId, id, userId, channel, body?.meta);
    if (this.metricsDaily?.onEvent)
      this.metricsDaily.onEvent(companyId, id, userId, 'SHARE');
    return res;
  }
}