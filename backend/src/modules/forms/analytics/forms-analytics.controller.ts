// src/modules/forms/forms-analytics.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { FormsRemindersService } from '../reminders/forms-reminders.service';
import { FormsService } from '../forms.service';

@Controller('v2/forms/analytics')
@UseGuards(JwtAccessGuard)
export class FormsAnalyticsController {
  constructor(
    private readonly ds: DataSource,
    private readonly reminders: FormsRemindersService,
    private readonly formsService: FormsService,
  ) {}

  private getCompanyIdSync(req: any): string | null {
    return (
      req?.user?.companyId ||
      req?.user?.company?.id ||
      req?.headers?.['x-company-id'] ||
      req?.query?.companyId ||
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
  async overview(@Req() req: any, @Query('companyId') companyIdQ?: string) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');

    // total forms
    const totalFormsRow = await this.ds.query(
      `SELECT COUNT(*)::int AS c FROM form WHERE "companyId" = $1`,
      [companyId],
    );
    const totalForms = totalFormsRow?.[0]?.c ?? 0;

    const totalQuestionsRow = await this.ds.query(
      `SELECT COUNT(*)::int AS c FROM form_field WHERE "companyId" = $1`,
      [companyId],
    );
    const totalQuestions = totalQuestionsRow?.[0]?.c ?? 0;

    const totalSubmissionsRow = await this.ds.query(
      `SELECT COUNT(*)::int AS c FROM form_submission WHERE "companyId" = $1`,
      [companyId],
    );
    const totalSubmissions = totalSubmissionsRow?.[0]?.c ?? 0;

    // backlog = pendentes
    const backlogRow = await this.ds.query(
      `SELECT COUNT(*)::int AS c
         FROM form_submission
        WHERE "companyId" = $1
          AND status = 'pending'`,
      [companyId],
    );
    const backlog = backlogRow?.[0]?.c ?? 0;

    // onTimeRate
    const onTimeRow = await this.ds.query(
      `SELECT
         SUM(CASE WHEN "isOnTime" = true THEN 1 ELSE 0 END)::int AS ontime,
         COUNT(*)::int AS total
       FROM form_submission
       WHERE "companyId" = $1`,
      [companyId],
    );
    const onTimeRate =
      onTimeRow?.[0]?.total
        ? onTimeRow[0].ontime / onTimeRow[0].total
        : 0;

    // externalRate
    const extRow = await this.ds.query(
      `SELECT
         SUM(CASE WHEN external = true THEN 1 ELSE 0 END)::int AS ext,
         COUNT(*)::int AS total
       FROM form_submission
       WHERE "companyId" = $1`,
      [companyId],
    );
    const externalRate =
      extRow?.[0]?.total
        ? extRow[0].ext / extRow[0].total
        : 0;

    // rhResponseRate → submissões com replyCount>0 ou status in ('approved','rejected','replied')
    const rhRow = await this.ds.query(
      `SELECT
         SUM(CASE WHEN ("replyCount" > 0 OR status IN ('approved','rejected','replied')) THEN 1 ELSE 0 END)::int AS responded,
         COUNT(*)::int AS total
       FROM form_submission
       WHERE "companyId" = $1`,
      [companyId],
    );
    const rhResponseRate =
      rhRow?.[0]?.total ? rhRow[0].responded / rhRow[0].total : 0;

    // daily series (últimos 30 dias)
    const series = await this.ds.query(
      `SELECT
         date("submittedAt") AS d,
         COUNT(*)::int AS submissions
       FROM form_submission
       WHERE "companyId" = $1
       GROUP BY 1
       ORDER BY d DESC
       LIMIT 30`,
      [companyId],
    );

    // top forms
    const topForms = await this.ds.query(
      `SELECT
         s."formId",
         f.title,
         COUNT(*)::int AS submissions
       FROM form_submission s
       LEFT JOIN form f
         ON f.id = s."formId"
        AND f."companyId" = s."companyId"
       WHERE s."companyId" = $1
       GROUP BY s."formId", f.title
       ORDER BY submissions DESC
       LIMIT 10`,
      [companyId],
    );

    // top spaces (unnest)
    const topSpaces = await this.ds.query(
      `SELECT
         x.space_id AS "spaceId",
         COUNT(*)::int AS submissions
       FROM (
         SELECT unnest(s."spaceIds") AS space_id
           FROM form_submission s
          WHERE s."companyId" = $1
       ) x
       GROUP BY x.space_id
       ORDER BY submissions DESC
       LIMIT 10`,
      [companyId],
    );

    return {
      totalForms,
      totalQuestions,
      totalSubmissions,
      backlog,
      onTimeRate,
      externalRate,
      rhResponseRate,
      series,
      topForms,
      topSpaces,
    };
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/list
  // ------------------------------------------------------
  @Get('list')
  async list(
    @Req() req: any,
    @Query('companyId') companyIdQ?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');

    const p = Number(page) || 1;
    const ps = Number(pageSize) || 50;
    const offset = (p - 1) * ps;

    const params: any[] = [companyId];
    let whereStatus = '';
    if (status) {
      params.push(status);
      whereStatus = `AND f.status = $2`;
    }

    const rows = await this.ds.query(
      `
      SELECT
        f.*,
        (
          SELECT COUNT(*)::int
            FROM form_submission s
           WHERE s."companyId" = f."companyId"
             AND s."formId"     = f.id
        ) AS "submissionsCount",
        (
          SELECT COUNT(*)::int
            FROM form_submission s
           WHERE s."companyId" = f."companyId"
             AND s."formId"     = f.id
             AND s."isOnTime" = true
        ) AS "onTimeSubmissions"
      FROM form f
      WHERE f."companyId" = $1
        ${whereStatus}
      ORDER BY f."createdAt" DESC
      LIMIT ${ps} OFFSET ${offset}
      `,
      params,
    );

    // total
    const totalRow = await this.ds.query(
      `SELECT COUNT(*)::int AS c FROM form f WHERE f."companyId" = $1 ${status ? 'AND f.status = $2' : ''}`,
      params,
    );
    const total = totalRow?.[0]?.c ?? rows.length;

    // calcular onTimeRate por form
    const items = rows.map((r: any) => {
      const totalSub = r.submissionsCount || 0;
      const onTime = r.onTimeSubmissions || 0;
      return {
        ...r,
        onTimeRate: totalSub ? onTime / totalSub : 0,
      };
    });

    return {
      total,
      page: p,
      pageSize: ps,
      items,
    };
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/:formId/stats
  // ------------------------------------------------------
  @Get(':formId/stats')
  async stats(
    @Req() req: any,
    @Param('formId') formId: string,
    @Query('companyId') companyIdQ?: string,
  ) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');

    // kpis básicos
    const kpis = await this.ds.query(
      `
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN external = true THEN 1 ELSE 0 END)::int AS external,
        SUM(CASE WHEN "fileCount" > 0 THEN 1 ELSE 0 END)::int AS withFiles,
        SUM(CASE WHEN ("replyCount" > 0 OR status IN ('approved','rejected','replied')) THEN 1 ELSE 0 END)::int AS rh
      FROM form_submission
      WHERE "companyId" = $1 AND "formId" = $2
      `,
      [companyId, formId],
    );
    const total = kpis?.[0]?.total ?? 0;
    const external = kpis?.[0]?.external ?? 0;
    const withFiles = kpis?.[0]?.withFiles ?? 0;
    const rh = kpis?.[0]?.rh ?? 0;

    // series de atividade (submits por dia)
    const activity = await this.ds.query(
      `
      SELECT
        date("submittedAt") AS d,
        COUNT(*)::int AS submissions
      FROM form_submission
      WHERE "companyId" = $1 AND "formId" = $2
      GROUP BY 1
      ORDER BY d DESC
      LIMIT 60
      `,
      [companyId, formId],
    );

    // reminders reais lidos de reminder_event
    const reminders = await this.ds.query(
      `
      SELECT
        ts,
        kind,
        type,
        meta
      FROM reminder_event
      WHERE "companyId" = $1 AND "formId" = $2
      ORDER BY ts DESC
      LIMIT 100
      `,
      [companyId, formId],
    );

    // segmentações por space
    const spaces = await this.ds.query(
      `
      SELECT
        x.space_id AS "spaceId",
        COUNT(*)::int AS submissions
      FROM (
        SELECT unnest(s."spaceIds") AS space_id
          FROM form_submission s
         WHERE s."companyId" = $1 AND s."formId" = $2
      ) x
      GROUP BY x.space_id
      ORDER BY submissions DESC
      `,
      [companyId, formId],
    );

    // segmentações por group
    const groups = await this.ds.query(
      `
      SELECT
        x.group_id AS "groupId",
        COUNT(*)::int AS submissions
      FROM (
        SELECT unnest(s."groupIds") AS group_id
          FROM form_submission s
         WHERE s."companyId" = $1 AND s."formId" = $2
      ) x
      GROUP BY x.group_id
      ORDER BY submissions DESC
      `,
      [companyId, formId],
    );

    return {
      kpis: {
        total,
        external,
        withFiles,
        rh,
      },
      activity,
      reminders,
      spaces,
      groups,
    };
  }

  // ------------------------------------------------------
  // POST /v2/forms/analytics/export
  // (CSV simples)
  // ------------------------------------------------------
  @Post('export')
  async exportCsv(
    @Req() req: any,
    @Body() body: { formId?: string },
    @Query('companyId') companyIdQ?: string,
  ) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');

    const formId = body.formId;
    if (!formId) throw new BadRequestException('formId missing');

    const rows = await this.ds.query(
      `
      SELECT
        s.id AS "submissionId",
        s."submittedAt",
        s.status,
        s.external,
        s."externalEmail",
        s."userId",
        s."spaceIds",
        s."groupIds",
        a."fieldId",
        a.type AS "answerType",
        a.value AS "answerValue",
        att."storagePath" AS "attachmentPath",
        att."mimeType" AS "attachmentMime"
      FROM form_submission s
      LEFT JOIN form_answer a
        ON a."companyId" = s."companyId"
       AND a."submissionId" = s.id
      LEFT JOIN form_attachment att
        ON att."companyId" = s."companyId"
       AND att."submissionId" = s.id
      WHERE s."companyId" = $1
        AND s."formId" = $2
      ORDER BY s."submittedAt" DESC, s.id ASC
      `,
      [companyId, formId],
    );

    // monta CSV
    const headers = [
      'submissionId',
      'submittedAt',
      'status',
      'external',
      'externalEmail',
      'userId',
      'spaceIds',
      'groupIds',
      'fieldId',
      'answerType',
      'answerValue',
      'attachmentPath',
      'attachmentMime',
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const line = [
        r.submissionId,
        r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
        r.status ?? '',
        r.external ? '1' : '0',
        r.externalEmail ?? '',
        r.userId ?? '',
        Array.isArray(r.spaceIds) ? `{${r.spaceIds.join(';')}}` : '',
        Array.isArray(r.groupIds) ? `{${r.groupIds.join(';')}}` : '',
        r.fieldId ?? '',
        r.answerType ?? '',
        (r.answerValue ?? '').toString().replace(/"/g, '""'),
        r.attachmentPath ?? '',
        r.attachmentMime ?? '',
      ];
      lines.push(line.map(v => `"${v}"`).join(','));
    }

    return {
      filename: `forms-${formId}.csv`,
      mime: 'text/csv',
      content: lines.join('\n'),
    };
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/badges
  // ------------------------------------------------------
  @Get('badges')
  async badges(@Req() req: any, @Query('companyId') companyIdQ?: string) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    const cmsUserId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!cmsUserId) throw new BadRequestException('user missing');

    const rows = await this.ds.query(
      `
      SELECT "formId","newCount","lastSeenAt"
        FROM form_badge_state
       WHERE "companyId" = $1
         AND "cmsUserId" = $2
      `,
      [companyId, cmsUserId],
    );

    return { items: rows };
  }

  // ------------------------------------------------------
  // POST /v2/forms/analytics/badges/ack
  // body: { formId: string }
  // ------------------------------------------------------
  @Post('badges/ack')
  async ackBadge(
    @Req() req: any,
    @Body() body: { formId: string },
    @Query('companyId') companyIdQ?: string,
  ) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    const cmsUserId = this.getUserId(req);
    if (!companyId) throw new BadRequestException('companyId missing');
    if (!cmsUserId) throw new BadRequestException('user missing');
    if (!body?.formId) throw new BadRequestException('formId missing');

    // tenta update
    const res = await this.ds.query(
      `
      UPDATE form_badge_state
         SET "newCount" = 0,
             "lastSeenAt" = now()
       WHERE "companyId" = $1
         AND "cmsUserId" = $2
         AND "formId" = $3
      `,
      [companyId, cmsUserId, body.formId],
    );

    // se não tinha linha, cria uma zerada
    await this.ds.query(
      `
      INSERT INTO form_badge_state ("companyId","cmsUserId","formId","newCount","lastSeenAt")
      VALUES ($1,$2,$3,0,now())
      ON CONFLICT ("companyId","cmsUserId","formId")
      DO UPDATE SET "newCount" = 0, "lastSeenAt" = now()
      `,
      [companyId, cmsUserId, body.formId],
    );

    return { ok: true };
  }

  // ------------------------------------------------------
  // GET /v2/forms/analytics/jobs
  // ------------------------------------------------------
  @Get('jobs')
  async jobs(@Req() req: any, @Query('companyId') companyIdQ?: string) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');

    const rows = await this.ds.query(
      `
      SELECT *
        FROM reminder_event
       WHERE "companyId" = $1
       ORDER BY ts DESC
       LIMIT 50
      `,
      [companyId],
    );

    return { items: rows };
  }

  // ------------------------------------------------------
  // POST /v2/forms/analytics/jobs/run-reminders
  // ------------------------------------------------------
  @Post('jobs/run-reminders')
  async runReminders(@Req() req: any, @Query('companyId') companyIdQ?: string) {
    const companyId = companyIdQ || this.getCompanyIdSync(req);
    if (!companyId) throw new BadRequestException('companyId missing');

    const res = await this.reminders.runForCompany(companyId);
    return res;
  }
}
