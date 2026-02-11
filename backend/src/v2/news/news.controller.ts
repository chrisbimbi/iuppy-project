// src/v2/news/news.controller.ts
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
import {
  NewsMetricsUsersServiceV2,
  ActionKind,
} from './news-metrics-users.service';

type V2ShareChannel = 'app' | 'email' | 'whatsapp' | 'telegram';

const REACTIONS = [
  'like',
  'love',
  'clap',
  'smile',
  'neutral',
  'angry',
] as const;
type ReactionType = (typeof REACTIONS)[number];

function normalizeReaction(v: unknown): ReactionType {
  const r = String(v ?? '')
    .trim()
    .toLowerCase();
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
    private readonly metricsUsers: NewsMetricsUsersServiceV2,
    @Optional() private readonly metricsDaily?: MetricsDailyServiceV2,
  ) { }

  // ==========================================================================
  // 🔥 ROTAS ESTÁTICAS PRIMEIRO (para evitar conflito com :id)
  // ==========================================================================

  /** Métricas em lote (batch) para listagens */
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

    const data = await this.analytics.batchNewsMetrics(
      companyId,
      ids,
      from,
      to,
    );

    const payload = { ids, from: from ?? null, to: to ?? null, data };
    const hash = createHash('sha1')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 32);
    const etag = `W/"${hash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Authorization');

    const ifNoneMatch =
      req.headers['if-none-match'] || req.headers['If-None-Match'];
    if (ifNoneMatch === etag) {
      res.status(304);
      return;
    }

    return data;
  }

  /** Meus favoritos */
  @Get('favorites')
  async listFavorites(
    @Query('page') pageStr: string,
    @Query('limit') limitStr: string,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;
    const page = Math.max(1, Number(pageStr || 1));
    const limit = Math.max(1, Math.min(100, Number(limitStr || 20)));

    return this.news.findFavorites(companyId, userId, { page, limit });
  }

  @Post(':id/favorite')
  async toggleFavorite(@Param('id') id: string, @Req() req: any) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;
    return this.news.toggleFavorite(companyId, id, userId);
  }

  // ==========================================================================
  // 🔥 ROTAS ESPECÍFICAS COM ID (que não são o detalhe genérico)
  // ==========================================================================

  /** Lista de usuários por ação (modal do analytics) */
  @Get(':id/users/:kind')
  async listUsersByAction(
    @Param('id') id: string,
    @Param('kind') kind: string,
    @Query('page') pageStr: string,
    @Query('q') q: string,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    const page = Number(pageStr || 1);
    const validKinds: ActionKind[] = [
      'opened',
      'acknowledged',
      'reacted',
      'commented',
      'shared',
      'favorited',
    ];
    const safeKind = validKinds.includes(kind as ActionKind)
      ? (kind as ActionKind)
      : 'opened';

    return this.metricsUsers.list(companyId, id, safeKind, {
      page,
      pageSize: 20,
      q,
    });
  }

  /** Lista de comentários (Admin/App) */
  @Get(':id/comments')
  async listComments(
    @Param('id') id: string,
    @Query('limit') limitStr: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Query('status')
    status: 'all' | 'pending' | 'approved' | 'rejected' | undefined,
    @Query('q') q: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('page') pageStr: string | undefined,
    @Query('pageSize') pageSizeStr: string | undefined,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId as string;
    const adminMode =
      typeof status !== 'undefined' ||
      typeof q !== 'undefined' ||
      typeof from !== 'undefined' ||
      typeof to !== 'undefined' ||
      typeof pageStr !== 'undefined' ||
      typeof pageSizeStr !== 'undefined';

    if (adminMode) {
      const page = Math.max(1, Number(pageStr ?? 1));
      const pageSize = Math.max(1, Math.min(200, Number(pageSizeStr ?? 50)));
      return this.news.listCommentsAdmin(companyId, id, {
        status: (status ?? 'all') as any,
        q: (q ?? '').trim() || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize,
      });
    }
    const limit = Math.max(1, Math.min(100, Number(limitStr ?? 50)));
    return this.news.listCommentsPublic(companyId, id, { limit, cursor });
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

  @Post(':id/audience/probe')
  async probe(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId as string;
    // O body deve conter os filtros de audiência
    return this.news.probeAudience(companyId, id, body);
    // throw new BadRequestException('Not implemented');
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
      req.headers['if-none-match'] || req.headers['If-None-Match'];
    if (ifNoneMatch === etag) {
      res.status(304);
      return;
    }
    return data;
  }

  // ==========================================================================
  // 🔥 ROTA GENÉRICA (:id) COMO ÚLTIMA OPÇÃO DE GET
  // ==========================================================================

  @Get(':id')
  async detail(
    @Param('id') id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId as string;
    const userId = (req.user.id || req.user.sub) as string;

    const data = await this.news.detail(companyId, id, userId);

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

    res.setHeader('Vary', 'Authorization');
    res.setHeader('ETag', etag);

    const ifNoneMatch =
      req.headers['if-none-match'] || req.headers['If-None-Match'];
    if (ifNoneMatch === etag) {
      res.status(304);
      return;
    }

    return data;
  }

  // ==========================================================================
  // 🔥 POSTS (Interações)
  // ==========================================================================

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

    const result = await this.news.ack(companyId, id, userId, _body?.meta);

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
    const res = await this.news.share(
      companyId,
      id,
      userId,
      channel,
      body?.meta,
    );
    if (this.metricsDaily?.onEvent)
      this.metricsDaily.onEvent(companyId, id, userId, 'SHARE');
    return res;
  }
}
