// backend/src/modules/forms/analytics/forms-analytics.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { FormsRemindersService } from '../reminders/forms-reminders.service';
import { FormsAnalyticsService } from './forms-analytics.service';
import type { Response } from 'express';

// DTOs
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AckBadgeDto, ExportDto } from './dto/analytics-body.dto';

// 🔥 GAP S1: Importa o novo ACL Guard
import { FormsAclGuard } from '../guards/forms-acl.guard';

@Controller('v2/forms/analytics')
@UseGuards(JwtAccessGuard) // 1. Autenticação primeiro
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class FormsAnalyticsController {
  constructor(
    private readonly analyticsService: FormsAnalyticsService,
    private readonly remindersService: FormsRemindersService,
  ) {
    console.log(
      '--- [DEBUG] FormsAnalyticsController v2 INICIALIZADO (Com DTOs Externos) ---',
    );
  }

  // Helper de S1/S2 (obtém do token, não da query)
  private getCompanyIdSync(req: any): string | null {
    return (
      req?.user?.companyId ||
      req?.user?.company?.id ||
      req?.headers?.['x-company-id'] ||
      null
    );
  }

  private getUserId(req: any): string | null {
    return req?.user?.id || req?.user?.sub || null;
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/overview
  // ------------------------------------------------------
  @Get('overview')
  async overview(@Req() req: any, @Query() q: AnalyticsQueryDto) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    // 🔥 GAP S2: Passa os filtros 'q' para o service
    return this.analyticsService.overview(companyId, q);
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/list
  // ------------------------------------------------------
  @Get('list')
  async list(@Req() req: any, @Query() q: AnalyticsQueryDto) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    // 🔥 GAP S2: Passa os filtros 'q' para o service
    return this.analyticsService.list(companyId, q);
  }

  // ------------------------------------------------------
  // 🔥 GAP S2: Endpoint de Agregação Manual
  // 🔥 ALTERADO (BUG 1)
  // ------------------------------------------------------
  @Post('run-aggregation')
  async runAggregation(
    @Req() req: any,
    @Body() body: { formId?: string; date: string }, // date YYYY-MM-DD
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    if (!body.date)
      throw new BadRequestException('date (YYYY-MM-DD) is required');

    // Alterado: Chama o novo método de serviço dedicado
    return this.analyticsService.runManualAggregation(
      companyId,
      body.date,
      body.formId,
    );
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/:formId/stats
  // 🔥 GAP S1: Protegido por ACL
  // ------------------------------------------------------
  @Get(':formId/stats')
  @UseGuards(FormsAclGuard) // 2. Autorização (ACL)
  async stats(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query() q: AnalyticsQueryDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    // 🔥 GAP S2: Passa os filtros 'q' para o service
    return this.analyticsService.formStats(companyId, formId, q);
  }

  // ------------------------------------------------------
  // 🔥 SPRINT 3: Novo Endpoint de Fricção / WordCloud
  // 🔥 GAP S1: Protegido por ACL
  // ------------------------------------------------------
  @Get(':formId/fields')
  @UseGuards(FormsAclGuard)
  async getFieldsStats(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query() q: AnalyticsQueryDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    return this.analyticsService.getFieldsStats(companyId, formId, q);
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/:formId/submissions
  // 🔥 GAP S1: Protegido por ACL
  // ------------------------------------------------------
  @Get(':formId/submissions')
  @UseGuards(FormsAclGuard)
  async submissions(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query() q: AnalyticsQueryDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');

    // @ts-ignore (Service tem o helper privado)
    const { from, to } = this.analyticsService.normalizeRange(q);
    const page = q.page ? Number(q.page) : 1;
    const pageSize = q.pageSize ? Number(q.pageSize) : 50;

    // 🔥 GAP S2: Passa os filtros 'q' para o service
    return this.analyticsService.submissions(
      companyId,
      formId,
      q, // Passa o DTO completo
      from,
      to,
      page,
      pageSize,
    );
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/:formId/notifications
  // 🔥 GAP S1: Protegido por ACL
  // ------------------------------------------------------
  @Get(':formId/notifications')
  @UseGuards(FormsAclGuard)
  async notifications(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query() q: AnalyticsQueryDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    return this.analyticsService.formNotifications(companyId, formId, q);
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/:formId/reminders
  // 🔥 GAP S1: Protegido por ACL
  // ------------------------------------------------------
  @Get(':formId/reminders')
  @UseGuards(FormsAclGuard)
  async reminders(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query() q: AnalyticsQueryDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    return this.analyticsService.formReminders(companyId, formId, q);
  }

  // ------------------------------------------------------
  // POST /v2/forms/analytics/export
  // 🔥 GAP S2: Refatorado para XLSX (Padrão Survey)
  // ------------------------------------------------------
  @Post('export')
  async export(
    @Req() req: any,
    @Body() body: ExportDto,
    @Res() res: Response,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');

    const format = body.format ?? 'xlsx';

    // DELEGA 100% PARA O SERVICE
    const buffer = await this.analyticsService.exportAnalytics(companyId, body);

    const date = new Date().toISOString().substring(0, 10);
    const filename = `export-forms-${body.formId ?? 'all'}-${date}.${format}`;

    if (format === 'xlsx') {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/badges
  // ------------------------------------------------------
  @Get('badges')
  async badges(@Req() req: any) {
    const companyId = this.getCompanyIdSync(req);
    const cmsUserId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    if (!cmsUserId) throw new BadRequestException('user missing from token');
    return this.analyticsService.badges(companyId, cmsUserId);
  }

  // ------------------------------------------------------
  // POST /v2/forms/analytics/badges/ack
  // ------------------------------------------------------
  @Post('badges/ack')
  async ackBadge(@Req() req: any, @Body() body: AckBadgeDto) {
    const companyId = this.getCompanyIdSync(req);
    const cmsUserId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    if (!cmsUserId) throw new BadRequestException('user missing from token');
    if (!body?.formId && !body?.all) {
      throw new BadRequestException('formId or all=true missing');
    }
    return this.analyticsService.ackBadges(companyId, cmsUserId, body);
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/jobs
  // ------------------------------------------------------
  @Get('jobs')
  async jobs(@Req() req: any) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    return this.analyticsService.jobs(companyId);
  }

  // ------------------------------------------------------
  // POST /v2/forms/analytics/jobs/run-reminders
  // ------------------------------------------------------
  @Post('jobs/run-reminders')
  async runReminders(@Req() req: any) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    return this.remindersService.runForCompany(companyId);
  }

  // ------------------------------------------------------
  // 🔥 SPRINT 3: Novo Endpoint de Logs (Com ACL)
  // ------------------------------------------------------
  @Get(':formId/logs')
  @UseGuards(FormsAclGuard)
  async getLogs(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query() q: AnalyticsQueryDto,
  ) {
    const companyId = this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing from token');
    return this.analyticsService.analyticsGetLogs(companyId, formId, q);
  }
}