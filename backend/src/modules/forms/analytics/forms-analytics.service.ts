import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

type DateRange = { from?: string; to?: string; timezone?: string; spaceId?: string; groupId?: string }

@Injectable()
export class FormsAnalyticsService {
  constructor(private readonly ds: DataSource) {}

  private normalizeRange(q: { from?: string; to?: string }): { from: string; to: string } {
    const now = new Date()
    const to = q.to ? new Date(q.to) : now
    const from = q.from ? new Date(q.from) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      from: from.toISOString().substring(0, 10),
      to: to.toISOString().substring(0, 10),
    }
  }

  async overview(companyId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q)

    // KPIs de submissão
    const kpiRows = await this.ds.query(
      `
      SELECT
        COUNT(*)::int AS "totalSubmissions",
        COUNT(DISTINCT s."formId")::int AS "formsWithSubmissions",
        COALESCE(SUM(CASE WHEN s."isOnTime" IS TRUE THEN 1 ELSE 0 END),0)::int AS "onTime",
        COALESCE(SUM(CASE WHEN s.external IS TRUE THEN 1 ELSE 0 END),0)::int AS "external",
        COALESCE(SUM(CASE WHEN s.status = 'replied' THEN 1 ELSE 0 END),0)::int AS "rhReplies",
        COALESCE(SUM(s."fileCount"),0)::int AS "attachments"
      FROM form_submission s
      WHERE s."companyId" = $1
        AND s."submittedAt" >= $2::timestamptz
        AND s."submittedAt" < ($3::date + INTERVAL '1 day')
      `,
      [companyId, from, to],
    )
    const k = kpiRows?.[0] ?? {
      totalSubmissions: 0,
      formsWithSubmissions: 0,
      onTime: 0,
      external: 0,
      rhReplies: 0,
      attachments: 0,
    }

    // total de formulários criados
    const formsCountRows = await this.ds.query(
      `SELECT COUNT(*)::int AS c FROM form WHERE "companyId" = $1`,
      [companyId],
    )
    const totalFormsCreated = Number(formsCountRows?.[0]?.c || 0)

    // total de perguntas
    const fieldsCountRows = await this.ds.query(
      `SELECT COUNT(*)::int AS c FROM form_field WHERE "companyId" = $1`,
      [companyId],
    )
    const totalQuestions = Number(fieldsCountRows?.[0]?.c || 0)

    // backlog atual
    const backlogRows = await this.ds.query(
      `SELECT COUNT(*)::int AS c
         FROM form_submission
        WHERE "companyId" = $1
          AND status = 'pending'`,
      [companyId],
    )
    const backlog = Number(backlogRows?.[0]?.c ?? 0)

    // série diária (usa materialização se houver)
    const daily = await this.ds.query(
      `SELECT
          "date",
          submits AS "submissions",
          "onTimeSubmits" AS "onTime",
          "pushSent",
          "pushOpened"
        FROM form_metrics_daily
        WHERE "companyId" = $1
          AND "date" >= $2::date
          AND "date" < $3::date
        ORDER BY "date" ASC
      `,
      [companyId, from, to],
    )

    // top forms
    const topForms = await this.ds.query(
      `SELECT
          s."formId",
          f.title,
          COUNT(*)::int AS submissions
        FROM form_submission s
        JOIN form f ON f.id = s."formId" AND f."companyId" = s."companyId"
        WHERE s."companyId" = $1
          AND s."submittedAt" >= $2::timestamptz
          AND s."submittedAt" < ($3::date + INTERVAL '1 day')
        GROUP BY s."formId", f.title
        ORDER BY submissions DESC
        LIMIT 10
      `,
      [companyId, from, to],
    )

    // top spaces
    const topSpaces = await this.ds.query(
      `WITH expanded AS (
        SELECT
          s."companyId",
          unnest(s."spaceIds") AS "spaceId"
        FROM form_submission s
        WHERE s."companyId" = $1
          AND s."submittedAt" >= $2::timestamptz
          AND s."submittedAt" < ($3::date + INTERVAL '1 day')
      )
      SELECT
        e."spaceId" AS "spaceId",
        COALESCE(sp.name, e."spaceId") AS name,
        COUNT(*)::int AS submissions
      FROM expanded e
      LEFT JOIN space sp ON sp.id = e."spaceId" AND sp."companyId" = $1
      GROUP BY e."spaceId", name
      ORDER BY submissions DESC
      LIMIT 10
      `,
      [companyId, from, to],
    )

    return {
      period: { from, to, timezone: q.timezone ?? 'UTC' },
      kpis: {
        totalForms: totalFormsCreated,
        totalQuestions,
        totalSubmissions: Number(k.totalSubmissions || 0),
        formsWithSubmissions: Number(k.formsWithSubmissions || 0),
        onTimeRate:
          Number(k.totalSubmissions || 0) > 0
            ? Number(k.onTime || 0) / Number(k.totalSubmissions || 0)
            : 0,
        externalRate:
          Number(k.totalSubmissions || 0) > 0
            ? Number(k.external || 0) / Number(k.totalSubmissions || 0)
            : 0,
        rhResponseRate:
          Number(k.totalSubmissions || 0) > 0
            ? Number(k.rhReplies || 0) / Number(k.totalSubmissions || 0)
            : 0,
        attachmentsShare:
          Number(k.totalSubmissions || 0) > 0
            ? Number(k.attachments || 0) / Number(k.totalSubmissions || 0)
            : 0,
        backlog,
      },
      daily,
      topForms,
      topSpaces,
      quality: {
        validationErrorsPer1kOpens: 0,
        topFieldsByErrorRate: [],
        attachment: { filesP95: 0, bytesP95: 0, failRate: 0 },
      },
      integrations: {
        webhooks: { calls: 0, success: 0, failure: 0, latencyMsP95: 0 },
      },
    }
  }

  async list(companyId: string, q: any) {
    const { from, to } = this.normalizeRange(q)
    const page = q.page ? Number(q.page) : 1
    const pageSize = q.pageSize ? Number(q.pageSize) : 50
    const statusFilter = q.status ? `AND f.status = $4` : ``
    const params: any[] = [companyId, from, to]
    if (q.status) params.push(q.status)

    const items = await this.ds.query(
      `
      SELECT
        f.id AS "formId",
        f.title,
        f.status,
        COALESCE(SUM(d.submits), 0)::int AS submissions,
        COALESCE(SUM(d."onTimeSubmits"), 0)::int AS "onTime",
        COALESCE(SUM(d."pushSent"), 0)::int AS "pushSent",
        COALESCE(SUM(d."pushOpened"), 0)::int AS "pushOpened",
        CASE
          WHEN COALESCE(SUM(d.submits),0) > 0
            THEN ROUND(COALESCE(SUM(d."onTimeSubmits"),0)::numeric / NULLIF(SUM(d.submits),0), 3)
          ELSE 0
        END AS "onTimeRate"
      FROM form f
      LEFT JOIN form_metrics_daily d
        ON d."companyId" = $1
       AND d."formId" = f.id
       AND d."date" >= $2::date
       AND d."date" < $3::date
      WHERE f."companyId" = $1
        ${statusFilter}
      GROUP BY f.id, f.title, f.status
      ORDER BY submissions DESC, "onTimeRate" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `,
      params,
    )

    const totalRow = await this.ds.query(
      `SELECT COUNT(*) AS c FROM form f WHERE f."companyId" = $1 ${statusFilter}`,
      params.slice(0, q.status ? 4 : 3),
    )
    const total = Number(totalRow?.[0]?.c || 0)

    return { items, total, page, pageSize }
  }

  async formStats(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q)

    const formRows = await this.ds.query(
      `SELECT id, title, status, "deadlineAt", anonymous, "allowExternal"
         FROM form
        WHERE "companyId" = $1 AND id = $2
        LIMIT 1`,
      [companyId, formId],
    )
    const form = formRows?.[0] ?? null

    const kpiRows = await this.ds.query(
      `
      SELECT
        COUNT(*)::int AS submissions,
        COALESCE(SUM(CASE WHEN s."isOnTime" IS TRUE THEN 1 ELSE 0 END),0)::int AS "onTime",
        COALESCE(SUM(CASE WHEN s.external IS TRUE THEN 1 ELSE 0 END),0)::int AS external,
        COALESCE(SUM(s."fileCount"),0)::int AS attachments,
        COALESCE(SUM(CASE WHEN s.status = 'replied' THEN 1 ELSE 0 END),0)::int AS "rhReplies",
        COALESCE(SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END),0)::int AS "pendingForRh"
      FROM form_submission s
      WHERE s."companyId" = $1
        AND s."formId" = $2
        AND s."submittedAt" >= $3::timestamptz
        AND s."submittedAt" < ($4::date + INTERVAL '1 day')
      `,
      [companyId, formId, from, to],
    )
    const k = kpiRows?.[0] ?? {
      submissions: 0,
      onTime: 0,
      external: 0,
      attachments: 0,
      rhReplies: 0,
      pendingForRh: 0,
    }

    const eligRows = await this.ds.query(
      `SELECT COALESCE(MAX(eligibles),0)::int AS eligibles
         FROM form_metrics_daily
        WHERE "companyId" = $1
          AND "formId" = $2
      `,
      [companyId, formId],
    )
    const eligibleUsers = Number(eligRows?.[0]?.eligibles || 0)

    const activity = await this.ds.query(
      `SELECT
          "date",
          submits AS "submissions",
          opens
        FROM form_metrics_daily
        WHERE "companyId" = $1
          AND "formId" = $2
          AND "date" >= $3::date
          AND "date" < $4::date
        ORDER BY "date" ASC
      `,
      [companyId, formId, from, to],
    )

    const rh = await this.ds.query(
      `SELECT
          date("createdAt") AS "date",
          COUNT(*) FILTER (WHERE type = 'reply')::int AS replies,
          COUNT(*) FILTER (WHERE type = 'approve')::int AS approvals,
          COUNT(*) FILTER (WHERE type = 'reject')::int AS rejections
        FROM form_rh_action
        WHERE "companyId" = $1
          AND "formId" = $2
          AND "createdAt" >= $3::timestamptz
          AND "createdAt" < ($4::date + INTERVAL '1 day')
        GROUP BY date("createdAt")
        ORDER BY date("createdAt") ASC
      `,
      [companyId, formId, from, to],
    )

    const notifications = await this.ds.query(
      `SELECT
          date(ts) AS "date",
          COUNT(*) FILTER (WHERE channel='push' AND type='sent')::int AS "pushSent",
          COUNT(*) FILTER (WHERE channel='push' AND (type='opened' OR type='clicked'))::int AS "pushOpened",
          COUNT(*) FILTER (WHERE channel='email' AND type='sent')::int AS "emailSent",
          COUNT(*) FILTER (WHERE channel='email' AND (type='opened' OR type='clicked'))::int AS "emailOpened",
          COUNT(*) FILTER (WHERE channel='email' AND type='clicked')::int AS "emailClicked"
        FROM notification_event
        WHERE "companyId" = $1
          AND "objectType" = 'form'
          AND "objectId" = $2
          AND ts >= $3::timestamptz
          AND ts < ($4::date + INTERVAL '1 day')
        GROUP BY date(ts)
        ORDER BY date(ts) ASC
      `,
      [companyId, formId, from, to],
    )

    const attachmentsSeries = await this.ds.query(
      `SELECT
          date("uploadedAt") AS "date",
          COUNT(*)::int AS files
        FROM form_attachment
        WHERE "companyId" = $1
          AND "formId" = $2
          AND "uploadedAt" >= $3::timestamptz
          AND "uploadedAt" < ($4::date + INTERVAL '1 day')
        GROUP BY date("uploadedAt")
        ORDER BY date("uploadedAt")
      `,
      [companyId, formId, from, to],
    )

    const bySpace = await this.ds.query(
      `WITH expanded AS (
        SELECT
          s."companyId",
          unnest(s."spaceIds") AS "spaceId"
        FROM form_submission s
        WHERE s."companyId" = $1
          AND s."formId" = $2
          AND s."submittedAt" >= $3::timestamptz
          AND s."submittedAt" < ($4::date + INTERVAL '1 day')
      )
      SELECT
        e."spaceId",
        COALESCE(sp.name, e."spaceId") AS name,
        COUNT(*)::int AS submissions
      FROM expanded e
      LEFT JOIN space sp ON sp.id = e."spaceId" AND sp."companyId" = $1
      GROUP BY e."spaceId", name
      ORDER BY submissions DESC
      `,
      [companyId, formId, from, to],
    )

    const byGroup = await this.ds.query(
      `WITH expanded AS (
        SELECT
          s."companyId",
          unnest(s."groupIds") AS "groupId"
        FROM form_submission s
        WHERE s."companyId" = $1
          AND s."formId" = $2
          AND s."submittedAt" >= $3::timestamptz
          AND s."submittedAt" < ($4::date + INTERVAL '1 day')
      )
      SELECT
        e."groupId",
        COALESCE(g.name, e."groupId") AS name,
        COUNT(*)::int AS submissions
      FROM expanded e
      LEFT JOIN "group" g ON g.id = e."groupId"
      GROUP BY e."groupId", name
      ORDER BY submissions DESC
      `,
      [companyId, formId, from, to],
    )

    // lembretes reais (tabela correta)
    const reminders = await this.ds.query(
      `
      SELECT
        kind,
        COUNT(*) FILTER (WHERE type='sent')::int AS sent,
        COUNT(*) FILTER (WHERE type='opened')::int AS opened
      FROM reminder_event
      WHERE "companyId" = $1
        AND "formId" = $2
        AND ts >= $3::timestamptz
        AND ts < ($4::date + INTERVAL '1 day')
      GROUP BY kind
      ORDER BY kind ASC
      `,
      [companyId, formId, from, to],
    )

    return {
      form,
      kpis: {
        eligibleUsers,
        submissions: Number(k.submissions || 0),
        onTime: Number(k.onTime || 0),
        late: Math.max(Number(k.submissions || 0) - Number(k.onTime || 0), 0),
        external: Number(k.external || 0),
        attachments: Number(k.attachments || 0),
        rhReplies: Number(k.rhReplies || 0),
        pendingForRh: Number(k.pendingForRh || 0),
      },
      series: {
        activity,
        rh,
        notifications,
        attachments: attachmentsSeries,
      },
      segments: {
        bySpace,
        byGroup,
        byAudience: [
          { type: 'internal', submits: Number(k.submissions || 0) - Number(k.external || 0) },
          { type: 'external', submits: Number(k.external || 0) },
        ],
      },
      reminders,
    }
  }

  async submissions(
    companyId: string,
    formId: string,
    from: string,
    to: string,
    page: number,
    pageSize: number,
  ) {
    const items = await this.ds.query(
      `
      SELECT
        s.id AS "submissionId",
        s."submittedAt",
        s.status,
        s."isOnTime",
        s.external,
        s."externalEmail",
        s."fileCount",
        s."spaceIds",
        s."groupIds",
        s."userId",
        u.name AS "userName"
      FROM form_submission s
      LEFT JOIN "user" u ON u.id = s."userId"
      WHERE s."companyId" = $1
        AND s."formId" = $2
        AND s."submittedAt" >= $3::timestamptz
        AND s."submittedAt" < ($4::date + INTERVAL '1 day')
      ORDER BY s."submittedAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `,
      [companyId, formId, from, to],
    )

    const totalRow = await this.ds.query(
      `SELECT COUNT(*) AS c
         FROM form_submission s
        WHERE s."companyId" = $1
          AND s."formId" = $2
          AND s."submittedAt" >= $3::timestamptz
          AND s."submittedAt" < ($4::date + INTERVAL '1 day')
      `,
      [companyId, formId, from, to],
    )
    const total = Number(totalRow?.[0]?.c || 0)
    return { total, page, pageSize, items }
  }

  async formNotifications(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q)
    const rows = await this.ds.query(
      `
      SELECT
        id,
        "userId",
        channel,
        type,
        ts,
        meta
      FROM notification_event
      WHERE "companyId" = $1
        AND "objectType" = 'form'
        AND "objectId" = $2
        AND ts >= $3::timestamptz
        AND ts < ($4::date + INTERVAL '1 day')
      ORDER BY ts DESC
      LIMIT 200
      `,
      [companyId, formId, from, to],
    )
    return { items: rows }
  }

  async formReminders(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q)
    const events = await this.ds.query(
      `
      SELECT
        id,
        "formId",
        kind,
        type,
        meta,
        ts
      FROM reminder_event
      WHERE "companyId" = $1
        AND "formId" = $2
        AND ts >= $3::timestamptz
        AND ts < ($4::date + INTERVAL '1 day')
      ORDER BY ts DESC
      `,
      [companyId, formId, from, to],
    )
    return { items: events }
  }

  async badges(companyId: string, cmsUserId: string) {
    const rows = await this.ds.query(
      `
      SELECT
        b."formId",
        f.title,
        b."lastSeenAt",
        b."newCount"
      FROM form_badge_state b
      LEFT JOIN form f ON f.id = b."formId" AND f."companyId" = b."companyId"
      WHERE b."companyId" = $1
        AND b."cmsUserId" = $2
      ORDER BY b."lastSeenAt" DESC NULLS LAST
      `,
      [companyId, cmsUserId],
    )
    const totalNew = rows.reduce((acc: number, r: any) => acc + (r.newCount || 0), 0)
    return { totalNew, byForm: rows }
  }

  async ackBadges(companyId: string, cmsUserId: string, body: { formId?: string; all?: boolean }) {
    if (body.all) {
      await this.ds.query(
        `UPDATE form_badge_state
            SET "lastSeenAt" = now(),
                "newCount" = 0
          WHERE "companyId" = $1
            AND "cmsUserId" = $2`,
        [companyId, cmsUserId],
      )
      return { ok: true }
    }
    if (body.formId) {
      await this.ds.query(
        `INSERT INTO form_badge_state("companyId","cmsUserId","formId","lastSeenAt","newCount")
         VALUES ($1,$2,$3,now(),0)
         ON CONFLICT ("companyId","cmsUserId","formId")
         DO UPDATE SET "lastSeenAt" = EXCLUDED."lastSeenAt", "newCount" = 0`,
        [companyId, cmsUserId, body.formId],
      )
      return { ok: true }
    }
    return { ok: true }
  }

  private escapeCsvCell(s: any): string {
    if (s === null || s === undefined) return ''
    const str = typeof s === 'string' ? s : JSON.stringify(s)
    if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
    return str
  }

  private buildAttachmentUrl(path: string): string {
    return path
  }

  async exportCsv(companyId: string, body: any): Promise<string> {
    const { from, to } = this.normalizeRange(body ?? {})
    const formId = body.formId as string | undefined

    const params: any[] = [companyId, from, to]
    const formFilter = formId ? `AND s."formId" = $4` : ``
    if (formId) params.push(formId)

    const rows = await this.ds.query(
      `
      SELECT
        s.id AS "submissionId",
        s."formId",
        f.title AS "formTitle",
        s."submittedAt",
        s.status,
        s."isOnTime",
        s.external,
        s."externalEmail",
        s."fileCount"
      FROM form_submission s
      LEFT JOIN form f ON f.id = s."formId" AND f."companyId" = s."companyId"
      WHERE s."companyId" = $1
        AND s."submittedAt" >= $2::timestamptz
        AND s."submittedAt" < ($3::date + INTERVAL '1 day')
        ${formFilter}
      ORDER BY s."submittedAt" DESC
      `,
      params,
    )

    const attach = await this.ds.query(
      `
      SELECT
        "submissionId",
        "storagePath"
      FROM form_attachment
      WHERE "companyId" = $1
      `,
      [companyId],
    )
    const attachBySub = new Map<string, string[]>()
    for (const a of attach) {
      const arr = attachBySub.get(a.submissionId) ?? []
      arr.push(this.buildAttachmentUrl(a.storagePath))
      attachBySub.set(a.submissionId, arr)
    }

    const header = [
      'submissionId',
      'formId',
      'formTitle',
      'submittedAt',
      'status',
      'isOnTime',
      'external',
      'externalEmail',
      'fileCount',
      'attachmentUrls',
    ]

    const lines = [header.map(h => this.escapeCsvCell(h)).join(',')]
    for (const r of rows) {
      const urls = attachBySub.get(r.submissionId) ?? []
      const line = [
        r.submissionId,
        r.formId,
        r.formTitle,
        r.submittedAt,
        r.status,
        r.isOnTime,
        r.external,
        r.externalEmail,
        r.fileCount,
        urls,
      ].map(v => this.escapeCsvCell(v))
      lines.push(line.join(','))
    }

    return lines.join('\n')
  }

  async jobs(companyId: string) {
    const lastReminders = await this.ds.query(
      `SELECT
         MAX(ts) AS "lastRun"
       FROM reminder_event
       WHERE "companyId" = $1`,
      [companyId],
    )
    return {
      queues: [
        { name: 'reminders', ready: 0, processing: 0, delayed: 0, failed: 0, deadletter: 0 },
        { name: 'emails', ready: 0, processing: 0, delayed: 0, failed: 0, deadletter: 0 },
      ],
      uptime: 86400,
      lastRun: lastReminders?.[0]?.lastRun ?? null,
    }
  }

  // apenas delega para o serviço de reminders "interno"
  async runReminders(companyId: string) {
    // aqui você pode injetar o FormsRemindersService e delegar
    // por agora, devolvo só uma flag
    return { ran: true, companyId }
  }
}
