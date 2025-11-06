import { Controller, Get, Post, Body, Query, Param, Res, UseGuards, Req } from '@nestjs/common'
import { Response } from 'express'
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard'
import { FormsAnalyticsV2Service } from './analytics.service'

class ListQueryDto {
  from!: string
  to!: string
  timezone?: string
  page?: number
  pageSize?: number
  status?: string
}

class ExportBodyDto {
  format?: 'csv'
  from!: string
  to!: string
  formIds?: string[]
}

/**
 * Versão canônica v2
 */
@UseGuards(JwtAccessGuard)
@Controller('v2/forms/analytics')
export class FormsAnalyticsV2Controller {
  constructor(private readonly svc: FormsAnalyticsV2Service) {}

  @Get('list')
  async list(@Req() req: any, @Query() q: ListQueryDto) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.list(companyId, q)
  }

  @Get(':formId/submissions')
  async submissions(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.submissions(companyId, formId, from, to, Number(page), Number(pageSize))
  }

  @Post('export')
  async exportCsv(@Req() req: any, @Body() body: ExportBodyDto, @Res() res: Response) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    const csv = await this.svc.exportCsv(companyId, body)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="forms-export.csv"')
    res.send(csv)
  }
}

/**
 * Alias/legado para ambientes onde o prefixo v2 não esteja aplicado
 */
@UseGuards(JwtAccessGuard)
@Controller('forms/analytics')
export class FormsAnalyticsLegacyController {
  constructor(private readonly svc: FormsAnalyticsV2Service) {}

  @Get('list')
  async list(@Req() req: any, @Query() q: ListQueryDto) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.list(companyId, q)
  }

  @Get(':formId/submissions')
  async submissions(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    return this.svc.submissions(companyId, formId, from, to, Number(page), Number(pageSize))
  }

  @Post('export')
  async exportCsv(@Req() req: any, @Body() body: ExportBodyDto, @Res() res: Response) {
    const companyId = String(req.user?.companyId || req.user?.company?.id || req.user?.cid)
    const csv = await this.svc.exportCsv(companyId, body)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="forms-export.csv"')
    res.send(csv)
  }
}