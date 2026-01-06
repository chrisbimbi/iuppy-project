import {
  Controller,
  Get,
  Query,
  Param,
  Req,
  UseGuards,
  Headers,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'node:crypto';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { AnalyticsV2Service } from './analytics.service';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';

@UseGuards(JwtAccessGuard)
@Controller('v2/analytics')
export class AnalyticsV2Controller {
  constructor(
    private readonly svc: AnalyticsV2Service,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  private makeEtag(
    companyId: string,
    route: string,
    params: Record<string, any>,
    last: string,
  ) {
    const key = JSON.stringify({ companyId, route, params, last });
    const hash = crypto.createHash('sha1').update(key).digest('hex');
    return `W/"v2:${route}:${hash}"`;
  }

  // =========================
  // 1) Overview de notícias
  // =========================
  @Get('news/overview')
  async newsOverview(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('spaceId') spaceId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Query('groupId') groupId: string | undefined,
    // novos opcionais (não quebram compat):
    @Query('excludeDeleted') excludeDeletedStr: string | undefined, // default: true
    @Query('sortBy')
    sortBy:
      | 'createdAt'
      | 'open'
      | 'ack'
      | 'reactions'
      | 'comments'
      | 'shares'
      | 'title'
      | undefined,
    @Query('sortDir') sortDir: 'asc' | 'desc' | undefined,
    @Query('page') pageStr: string | undefined,
    @Query('pageSize') pageSizeStr: string | undefined,

    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId;

    const excludeDeleted = excludeDeletedStr === 'false' ? false : true;
    const page = Math.max(1, Number(pageStr ?? 1));
    const pageSize = Math.max(1, Math.min(500, Number(pageSizeStr ?? 100)));

    const last = await this.schema.getLastUpdateMarker(companyId, from, to);
    const etag = this.makeEtag(
      companyId,
      'news/overview',
      {
        from,
        to,
        spaceId,
        channelId,
        groupId,
        excludeDeleted,
        sortBy,
        sortDir,
        page,
        pageSize,
      },
      last,
    );
    if (inm && inm === etag) {
      res.setHeader('ETag', etag);
      res.status(304);
      return;
    }
    res.setHeader('ETag', etag);

    const data = await this.svc.newsOverview(companyId, {
      from,
      to,
      spaceId,
      channelId,
      groupId,
      excludeDeleted,
      sortBy,
      sortDir,
      page,
      pageSize,
    });
    return { ...data, etag, serverTime: new Date().toISOString() };
  }

  // =========================
  // 2) Batch de métricas por IDs
  //    /v2/analytics/news/metrics?ids=a,b,c
  // =========================
  @Get('news/metrics')
  async batchNewsMetrics(
    @Query('ids') idsCsv: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId;
    const uuidRe = /^[0-9a-fA-F-]{36}$/;
    const ids = (idsCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && uuidRe.test(s));

    const last = await this.schema.getLastUpdateMarker(companyId, from, to);
    const etag = this.makeEtag(
      companyId,
      'news/metrics',
      { ids, from, to },
      last,
    );
    if (inm && inm === etag) {
      res.setHeader('ETag', etag);
      res.status(304);
      return;
    }
    res.setHeader('ETag', etag);

    const map = await this.svc.batchNewsMetrics(companyId, ids, from, to);
    // Retorno plano: chaves = IDs, mais etag/serverTime
    return { ...map, etag, serverTime: new Date().toISOString() };
  }

  // =========================
  // 3) Métricas por notícia (UUID)
  //    regex evita colisão com /news/overview e /news/metrics
  // =========================
  @Get('news/:id([0-9a-fA-F-]{36})')
  async newsMetrics(
    @Param('id') id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId;
    const last = await this.schema.getLastUpdateMarker(companyId, from, to);
    const etag = this.makeEtag(companyId, 'news/:id', { id, from, to }, last);
    if (inm && inm === etag) {
      res.setHeader('ETag', etag);
      res.status(304);
      return;
    }
    res.setHeader('ETag', etag);
    const data = await this.svc.newsMetrics(companyId, id, from, to);
    return { ...data, etag, serverTime: new Date().toISOString() };
  }

  // =========================
  // 4) Overview de usuários
  // =========================
  @Get('users/overview')
  async usersOverview(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('spaceId') spaceId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Query('groupId') groupId: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId;
    const last = await this.schema.getLastUpdateMarker(companyId, from, to);
    const etag = this.makeEtag(
      companyId,
      'users/overview',
      { from, to, spaceId, channelId, groupId },
      last,
    );
    if (inm && inm === etag) {
      res.setHeader('ETag', etag);
      res.status(304);
      return;
    }
    res.setHeader('ETag', etag);
    const data = await this.svc.usersOverview(companyId, {
      from,
      to,
      spaceId,
      channelId,
      groupId,
    });
    return { ...data, etag, serverTime: new Date().toISOString() };
  }

  // =========================
  // 5) Overview de busca
  // =========================
  @Get('search/overview')
  async searchOverview(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId;
    const last = await this.schema.getLastUpdateMarker(companyId, from, to);
    const etag = this.makeEtag(
      companyId,
      'search/overview',
      { from, to },
      last,
    );
    if (inm && inm === etag) {
      res.setHeader('ETag', etag);
      res.status(304);
      return;
    }
    res.setHeader('ETag', etag);
    const data = await this.svc.searchOverview(companyId, { from, to });
    return { ...data, etag, serverTime: new Date().toISOString() };
  }
}
