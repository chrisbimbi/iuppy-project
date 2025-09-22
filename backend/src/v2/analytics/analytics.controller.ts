import { Controller, Get, Query, Param, Req, UseGuards, Headers, Res } from '@nestjs/common'
import { Response } from 'express'
import * as crypto from 'node:crypto'
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard'
import { AnalyticsV2Service } from './analytics.service'
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2'

@UseGuards(JwtAccessGuard)
@Controller('v2/analytics')
export class AnalyticsV2Controller {
  constructor(
    private readonly svc: AnalyticsV2Service,
    private readonly schema: SchemaIntrospectorV2,
  ) {}

  private makeEtag(companyId: string, route: string, params: Record<string, any>, last: string) {
    const key = JSON.stringify({ companyId, route, params, last })
    const hash = crypto.createHash('sha1').update(key).digest('hex')
    return `W/"v2:${route}:${hash}"`
  }

  // Métricas por notícia
  @Get('news/:id')
  async newsMetrics(
    @Param('id') id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId
    const last = await this.schema.getLastUpdateMarker(companyId, from, to)
    const etag = this.makeEtag(companyId, 'news/:id', { id, from, to }, last)
    if (inm && inm === etag) {
      res.setHeader('ETag', etag)
      res.status(304)
      return
    }
    res.setHeader('ETag', etag)
    const data = await this.svc.newsMetrics(companyId, id, from, to)
    return { ...data, etag, serverTime: new Date().toISOString() }
  }

  // Overview de notícias
  @Get('news/overview')
  async newsOverview(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('spaceId') spaceId: string | undefined,
    @Query('channelId') channelId: string | undefined,
    @Query('groupId') groupId: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId
    const last = await this.schema.getLastUpdateMarker(companyId, from, to)
    const etag = this.makeEtag(companyId, 'news/overview', { from, to, spaceId, channelId, groupId }, last)
    if (inm && inm === etag) {
      res.setHeader('ETag', etag)
      res.status(304)
      return
    }
    res.setHeader('ETag', etag)
    const data = await this.svc.newsOverview(companyId, { from, to, spaceId, channelId, groupId })
    return { ...data, etag, serverTime: new Date().toISOString() }
  }

  // Overview de usuários
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
    const companyId = req.user.companyId
    const last = await this.schema.getLastUpdateMarker(companyId, from, to)
    const etag = this.makeEtag(companyId, 'users/overview', { from, to, spaceId, channelId, groupId }, last)
    if (inm && inm === etag) {
      res.setHeader('ETag', etag)
      res.status(304)
      return
    }
    res.setHeader('ETag', etag)
    const data = await this.svc.usersOverview(companyId, { from, to, spaceId, channelId, groupId })
    return { ...data, etag, serverTime: new Date().toISOString() }
  }

  // Overview de busca
  @Get('search/overview')
  async searchOverview(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: any,
    @Headers('if-none-match') inm: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const companyId = req.user.companyId
    const last = await this.schema.getLastUpdateMarker(companyId, from, to)
    const etag = this.makeEtag(companyId, 'search/overview', { from, to }, last)
    if (inm && inm === etag) {
      res.setHeader('ETag', etag)
      res.status(304)
      return
    }
    res.setHeader('ETag', etag)
    const data = await this.svc.searchOverview(companyId, { from, to })
    return { ...data, etag, serverTime: new Date().toISOString() }
  }
}