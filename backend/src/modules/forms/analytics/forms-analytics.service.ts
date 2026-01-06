// backend/src/modules/forms/analytics/forms-analytics.service.ts
import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as natural from 'natural';
import { TranslatableString } from '../entities/form.entity';

type DateRange = {
  from?: string;
  to?: string;
  timezone?: string;
  spaceId?: string;
  groupId?: string;
  audience?: 'all' | 'internal' | 'external';
};

type ExportBody = {
  formId?: string;
  format?: 'csv' | 'xlsx';
  include?: string[];
  filters?: DateRange;
};

type FieldStat = {
  fieldId: string;
  label: any;
  type: string;
  metrics: {
    focus: number;
    changes: number;
    validationErrors: number;
    errorRate: number;
    avgTimeMs: number;
    abandonAfterErrorRate: number;
  };
  distribution?: any;
  topWords?: Array<{ word: string; count: number }>;
  bigrams?: Array<{ phrase: string; count: number }>;
  trigrams?: Array<{ phrase: string; count: number }>;
};

@Injectable()
export class FormsAnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(FormsAnalyticsService.name);

  private tableNames = {
    space: 'space',
    group: 'user_group',
    user: 'user_entity',
  };

  constructor(private readonly ds: DataSource) {}

  async onModuleInit() {
    this.logger.log(
      `[FormsAnalyticsService] Tables: ${JSON.stringify(this.tableNames)}`,
    );
  }

  // @ts-ignore
  public normalizeRange(q: { from?: string; to?: string }): {
    from: string;
    to: string;
  } {
    const now = new Date();
    const to = q.to ? new Date(q.to) : new Date();
    to.setHours(23, 59, 59, 999);
    const from = q.from
      ? new Date(q.from)
      : new Date(new Date().setDate(now.getDate() - 7));
    from.setHours(0, 0, 0, 0);
    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  }

  private buildFilterWhere(
    q: DateRange,
    alias: string,
    paramIndexStart: number,
  ) {
    const params: any[] = [];
    const wheres: string[] = [];
    let pIdx = paramIndexStart;
    const { from, to } = this.normalizeRange(q);

    params.push(new Date(from).toISOString());
    wheres.push(`${alias}."submittedAt" >= $${pIdx}::timestamptz`);
    pIdx++;

    params.push(new Date(to).toISOString());
    wheres.push(`${alias}."submittedAt" < ($${pIdx}::date + INTERVAL '1 day')`);
    pIdx++;

    if (q.audience === 'internal') wheres.push(`${alias}.external = false`);
    else if (q.audience === 'external') wheres.push(`${alias}.external = true`);

    if (q.spaceId) {
      const ids = q.spaceId.split(',').filter(Boolean);
      if (ids.length > 0) {
        params.push(ids);
        wheres.push(`${alias}."spaceIds" && $${pIdx}::text[]`);
        pIdx++;
      }
    }
    if (q.groupId) {
      const ids = q.groupId.split(',').filter(Boolean);
      if (ids.length > 0) {
        params.push(ids);
        wheres.push(`${alias}."groupIds" && $${pIdx}::text[]`);
        pIdx++;
      }
    }
    return {
      where: wheres.length > 0 ? `AND ${wheres.join(' AND ')}` : '',
      params,
    };
  }

  private async safeQuery(sql: string, params: any[]) {
    try {
      return await this.ds.query(sql, params);
    } catch (e: any) {
      this.logger.error(`Query Failed: ${e.message}`, e.stack);
      throw e;
    }
  }

  private async safeQueryOptional(sql: string, params: any[]) {
    try {
      return await this.ds.query(sql, params);
    } catch (e: any) {
      this.logger.warn(`Query Optional Failed: ${e.message}`);
      return [];
    }
  }

  private formatMsToHuman(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) return 'N/A';
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    const minutes = seconds / 60;
    if (minutes < 60) return `${minutes.toFixed(0)}m`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = hours / 24;
    return `${days.toFixed(1)}d`;
  }

  // --- AGGREGATION ---
  async runDailyAggregation(
    companyId: string,
    dateStr: string,
    formId?: string,
  ) {
    const date = new Date(dateStr);
    const startOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    ).toISOString();
    const endOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    ).toISOString();

    const formFilter = formId ? `AND f.id = $2::uuid` : '';
    const formParams = formId ? [companyId, formId] : [companyId];
    const forms = await this.safeQuery(
      `SELECT id FROM form f WHERE f."companyId" = $1 ${formFilter}`,
      formParams,
    );
    let totalForms = 0;

    for (const form of forms) {
      const params = [companyId, form.id, startOfDay, endOfDay];
      const metrics = await this.safeQuery(
        `WITH subs AS (SELECT "isOnTime", "external" FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2::uuid AND s."submittedAt">=$3::timestamptz AND s."submittedAt"<=$4::timestamptz),
              events AS (SELECT "type" FROM form_event e WHERE e."companyId"=$1 AND e."formId"=$2::uuid AND e.ts>=$3::timestamptz AND e.ts<=$4::timestamptz),
              notifs AS (SELECT "channel","type" FROM notification_event n WHERE n."companyId"=$1 AND n."objectType"='form' AND n."objectId"=$2::text AND n.ts>=$3::timestamptz AND n.ts<=$4::timestamptz)
         SELECT
           (SELECT COUNT(*) FROM subs)::int AS submits,
           (SELECT COUNT(*) FROM subs WHERE "isOnTime"=true)::int AS "onTimeSubmits",
           (SELECT COUNT(*) FROM subs WHERE "external"=false)::int AS "internalSubmits",
           (SELECT COUNT(*) FROM subs WHERE "external"=true)::int AS "externalSubmits",
           (SELECT COUNT(*) FROM events WHERE "type"='form_open')::int AS opens,
           (SELECT COUNT(*) FROM events WHERE "type"='form_start')::int AS starts,
           (SELECT COUNT(*) FROM events WHERE "type"='form_impression')::int AS impressions,
           (SELECT COUNT(*) FROM notifs WHERE "channel"='push' AND "type"='sent')::int AS "pushSent",
           (SELECT COUNT(*) FROM notifs WHERE "channel"='push' AND ("type"='opened' OR "type"='clicked'))::int AS "pushOpened",
           (SELECT COUNT(*) FROM notifs WHERE "channel"='email' AND "type"='sent')::int AS "emailSent",
           (SELECT COUNT(*) FROM notifs WHERE "channel"='email' AND ("type"='opened' OR "type"='clicked'))::int AS "emailOpened",
           (SELECT COUNT(*) FROM notifs WHERE "channel"='email' AND "type"='clicked')::int AS "emailClicked"
        `,
        params,
      );

      const m = metrics[0] ?? {};
      await this.safeQuery(
        `INSERT INTO "form_metrics_daily" ("companyId","formId","date","eligibles","impressions","opens","starts","submits","onTimeSubmits","internalSubmits","externalSubmits","pushSent","pushOpened","emailSent","emailOpened","emailClicked")
         VALUES ($1,$2::uuid,$3::date,0,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT ("companyId","formId","date") DO UPDATE SET
         "impressions"=EXCLUDED."impressions", "opens"=EXCLUDED."opens", "starts"=EXCLUDED."starts", "submits"=EXCLUDED."submits",
         "onTimeSubmits"=EXCLUDED."onTimeSubmits", "internalSubmits"=EXCLUDED."internalSubmits", "externalSubmits"=EXCLUDED."externalSubmits",
         "pushSent"=EXCLUDED."pushSent", "pushOpened"=EXCLUDED."pushOpened", "emailSent"=EXCLUDED."emailSent", "emailOpened"=EXCLUDED."emailOpened", "emailClicked"=EXCLUDED."emailClicked"`,
        [
          companyId,
          form.id,
          dateStr,
          m.impressions || 0,
          m.opens || 0,
          m.starts || 0,
          m.submits || 0,
          m.onTimeSubmits || 0,
          m.internalSubmits || 0,
          m.externalSubmits || 0,
          m.pushSent || 0,
          m.pushOpened || 0,
          m.emailSent || 0,
          m.emailOpened || 0,
          m.emailClicked || 0,
        ],
      );
      totalForms++;
    }
    return { ok: true, processedForms: totalForms, date: dateStr };
  }

  async runManualAggregation(companyId: string, date: string, formId?: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new BadRequestException('Invalid date format');
    return this.runDailyAggregation(companyId, date, formId);
  }

  // --- OVERVIEW (DASHBOARD GERAL) ---
  async overview(companyId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q);
    const filters = this.buildFilterWhere(q, 's', 2);
    const params = [companyId, ...filters.params];

    const results = await Promise.allSettled([
      // 0: KPIs Gerais
      this.safeQuery(
        `
        SELECT
          COUNT(*)::int AS "totalSubmissions",
          COUNT(DISTINCT s."userId")::int AS "totalUniqueUsers",
          COUNT(DISTINCT s."formId")::int AS "formsWithSubmissions",
          COALESCE(SUM(CASE WHEN s."isOnTime" IS TRUE THEN 1 ELSE 0 END),0)::int AS "onTime",
          COALESCE(SUM(CASE WHEN s.external IS TRUE THEN 1 ELSE 0 END),0)::int AS "external",
          COALESCE(SUM(CASE 
            WHEN s.status IN ('approved', 'rejected', 'replied') THEN 1 
            WHEN s."replyCount" > 0 THEN 1 
            ELSE 0 
          END),0)::int AS "rhReplies",
          COALESCE(SUM(s."fileCount"),0)::int AS "attachments"
        FROM form_submission s
        WHERE s."companyId" = $1 ${filters.where}
      `,
        params,
      ),
      // 1,2,3: Totais e Backlog
      this.safeQuery(
        `SELECT COUNT(*)::int AS c FROM form WHERE "companyId" = $1`,
        [companyId],
      ),
      this.safeQuery(
        `SELECT COUNT(*)::int AS c FROM form_field WHERE "companyId" = $1`,
        [companyId],
      ),
      this.safeQuery(
        `SELECT COUNT(*)::int AS c FROM form_submission WHERE "companyId"=$1 AND status IN ('pending', 'submitted')`,
        [companyId],
      ),
      // 4: Série Diária
      this.safeQuery(
        `
        SELECT "date", SUM(submits) AS "submissions", SUM("onTimeSubmits") AS "onTime"
        FROM form_metrics_daily WHERE "companyId"=$1 AND "date">=$2::date AND "date"<($3::date + INTERVAL '1 day')
        GROUP BY "date" ORDER BY "date" ASC
      `,
        [companyId, from, to],
      ),
      // 5: Top Forms
      this.safeQuery(
        `
        SELECT s."formId", f.title, COUNT(*)::int AS submissions
        FROM form_submission s JOIN form f ON f.id=s."formId" AND f."companyId"=s."companyId"
        WHERE s."companyId"=$1 ${filters.where}
        GROUP BY s."formId", f.title ORDER BY submissions DESC LIMIT 10
      `,
        params,
      ),
      // 6: Top Spaces
      this.safeQueryOptional(
        `
        WITH expanded AS (SELECT s."companyId", unnest(s."spaceIds") AS "spaceIdText" FROM form_submission s WHERE s."companyId"=$1 AND s."spaceIds" IS NOT NULL ${filters.where})
        SELECT e."spaceIdText" AS "spaceId", COALESCE(sp.name, e."spaceIdText") AS name, COUNT(*)::int AS submissions
        FROM expanded e LEFT JOIN ${this.tableNames.space} sp ON sp.id::text = e."spaceIdText" AND sp."companyId"=$1
        GROUP BY e."spaceIdText", name ORDER BY submissions DESC LIMIT 10
      `,
        params,
      ),
      // 7: Top Grupos
      this.safeQueryOptional(
        `
        WITH expanded AS (SELECT s."companyId", unnest(s."groupIds") AS "groupIdText" FROM form_submission s WHERE s."companyId"=$1 AND s."groupIds" IS NOT NULL ${filters.where})
        SELECT e."groupIdText" AS "groupId", COALESCE(g.name, e."groupIdText") AS name, COUNT(*)::int AS submissions
        FROM expanded e LEFT JOIN ${this.tableNames.group} g ON g.id::text = e."groupIdText" AND g."companyId"=$1
        GROUP BY e."groupIdText", name ORDER BY submissions DESC LIMIT 10
      `,
        params,
      ),
      // 8: Top Usuários
      this.safeQueryOptional(
        `
        SELECT s."userId", COALESCE(u.name, s."userId") AS name, COUNT(*)::int AS submissions
        FROM form_submission s LEFT JOIN ${this.tableNames.user} u ON u.id::text = s."userId"
        WHERE s."companyId"=$1 ${filters.where}
        GROUP BY s."userId", u.name ORDER BY submissions DESC LIMIT 10
      `,
        params,
      ),
    ]);

    const getResult = (i: number, def: any = []) =>
      results[i].status === 'fulfilled' ? (results[i] as any).value : def;
    const k = getResult(0, [{}])[0] ?? {};

    return {
      period: { from, to, timezone: q.timezone ?? 'UTC' },
      kpis: {
        totalForms: Number(getResult(1, [{ c: 0 }])[0]?.c || 0),
        totalQuestions: Number(getResult(2, [{ c: 0 }])[0]?.c || 0),
        totalSubmissions: Number(k.totalSubmissions || 0),
        totalUniqueUsers: Number(k.totalUniqueUsers || 0),
        formsWithSubmissions: Number(k.formsWithSubmissions || 0),
        onTimeRate:
          k.totalSubmissions > 0
            ? Number(k.onTime || 0) / k.totalSubmissions
            : 0,
        externalRate:
          k.totalSubmissions > 0
            ? Number(k.external || 0) / k.totalSubmissions
            : 0,
        rhResponseRate:
          k.totalSubmissions > 0
            ? Number(k.rhReplies || 0) / k.totalSubmissions
            : 0,
        attachmentsShare:
          k.totalSubmissions > 0
            ? Number(k.attachments || 0) / k.totalSubmissions
            : 0,
        backlog: Number(getResult(3, [{ c: 0 }])[0]?.c || 0),
      },
      daily: getResult(4),
      topForms: getResult(5),
      topSpaces: getResult(6),
      topGroups: getResult(7),
      topUsers: getResult(8),
    };
  }

  // --- LISTA ---
  async list(companyId: string, q: any) {
    const { from, to } = this.normalizeRange(q);
    const page = q.page ? Number(q.page) : 1;
    const pageSize = q.pageSize ? Number(q.pageSize) : 50;
    const params = [companyId];
    let statusFilter = '';
    if (q.status) {
      params.push(q.status);
      statusFilter = `AND f.status = $2`;
    }

    const items = await this.safeQuery(
      `
      SELECT f.id AS "formId", f.title, f.status,
        COALESCE(d.totalSubmissions, 0)::int AS submissions,
        COALESCE(d.totalOnTime, 0)::int AS "onTime",
        COALESCE(d.totalPushSent, 0)::int AS "pushSent",
        CASE WHEN COALESCE(d.totalSubmissions,0)>0 THEN ROUND(COALESCE(d.totalOnTime,0)::numeric/NULLIF(d.totalSubmissions,0),3) ELSE 0 END AS "onTimeRate"
      FROM form f
      LEFT JOIN (
        SELECT "formId", SUM(submits) AS totalSubmissions, SUM("onTimeSubmits") AS totalOnTime, SUM("pushSent") AS totalPushSent
        FROM form_metrics_daily WHERE "companyId"=$1 GROUP BY "formId"
      ) d ON d."formId"=f.id
      WHERE f."companyId"=$1 ${statusFilter}
      ORDER BY submissions DESC, f."createdAt" DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `,
      params,
    );

    const totalRow = await this.safeQuery(
      `SELECT COUNT(*) AS c FROM form f WHERE f."companyId"=$1 ${statusFilter}`,
      params,
    );
    return { items, total: Number(totalRow?.[0]?.c || 0), page, pageSize };
  }

  // --- FORM STATS ---
  async formStats(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q);
    const filters = this.buildFilterWhere(q, 's', 3);
    const kpiParams = [companyId, formId, ...filters.params];
    const filtersJoin = this.buildFilterWhere(q, 's', 5);
    const joinParams = [companyId, formId, from, to, ...filtersJoin.params];
    const dateParams = [companyId, formId, from, to];

    const results = await Promise.allSettled([
      // 0: Form
      this.safeQuery(
        `SELECT id, title, status, "deadlineAt", anonymous, "allowExternal", "defaultLocale" FROM form WHERE "companyId"=$1 AND id=$2::uuid LIMIT 1`,
        [companyId, formId],
      ),
      // 1: KPIs
      this.safeQuery(
        `
        SELECT
          COUNT(*)::int AS submissions,
          COUNT(DISTINCT s."userId")::int AS "uniqueUsers",
          COALESCE(SUM(CASE WHEN s."isOnTime" IS TRUE THEN 1 ELSE 0 END),0)::int AS "onTime",
          COALESCE(SUM(CASE WHEN s.external IS TRUE THEN 1 ELSE 0 END),0)::int AS external,
          COALESCE(SUM(s."fileCount"),0)::int AS attachments,
          COALESCE(SUM(CASE 
            WHEN s.status IN ('approved', 'rejected', 'replied') THEN 1 
            WHEN s."replyCount" > 0 THEN 1 
            ELSE 0 
          END),0)::int AS "rhReplies",
          COALESCE(SUM(CASE WHEN s.status IN ('pending', 'submitted') THEN 1 ELSE 0 END),0)::int AS "pendingForRh"
        FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where}
      `,
        kpiParams,
      ),
      this.safeQuery(
        `SELECT COALESCE(SUM(eligibles),0)::int AS eligibles FROM form_metrics_daily WHERE "companyId"=$1 AND "formId"=$2::uuid`,
        [companyId, formId],
      ),
      this.safeQuery(
        `SELECT "date", submits AS "submissions", opens, starts, impressions FROM form_metrics_daily WHERE "companyId"=$1 AND "formId"=$2::uuid AND "date">=$3::date AND "date"<($4::date + INTERVAL '1 day') ORDER BY "date" ASC`,
        dateParams,
      ),
      this.safeQuery(
        `SELECT date(a."createdAt") AS "date", COUNT(*) FILTER (WHERE a.type='reply')::int AS replies, COUNT(*) FILTER (WHERE a.type='approve')::int AS approvals, COUNT(*) FILTER (WHERE a.type='reject')::int AS rejections FROM form_rh_action a JOIN form_submission s ON s.id=a."submissionId" WHERE a."companyId"=$1 AND a."formId"=$2::uuid AND a."createdAt">=$3::timestamptz AND a."createdAt"<($4::date + INTERVAL '1 day') ${filtersJoin.where} GROUP BY date(a."createdAt") ORDER BY date(a."createdAt")`,
        joinParams,
      ),
      this.safeQuery(
        `SELECT date(ts) AS "date", COUNT(*) FILTER (WHERE channel='push' AND type='sent')::int AS "pushSent", COUNT(*) FILTER (WHERE channel='push' AND (type='opened' OR type='clicked'))::int AS "pushOpened", COUNT(*) FILTER (WHERE channel='email' AND type='sent')::int AS "emailSent", COUNT(*) FILTER (WHERE channel='email' AND (type='opened' OR type='clicked'))::int AS "emailOpened" FROM notification_event WHERE "companyId"=$1 AND "objectType"='form' AND "objectId"=$2::text AND ts>=$3::timestamptz AND ts<($4::date + INTERVAL '1 day') GROUP BY date(ts) ORDER BY date(ts)`,
        dateParams,
      ),
      this.safeQuery(
        `SELECT date(a."uploadedAt") AS "date", COUNT(*)::int AS files FROM form_attachment a JOIN form_submission s ON s.id=a."submissionId" WHERE a."companyId"=$1 AND a."formId"=$2::uuid AND a."uploadedAt">=$3::timestamptz AND a."uploadedAt"<($4::date + INTERVAL '1 day') ${filtersJoin.where} GROUP BY date(a."uploadedAt") ORDER BY date(a."uploadedAt")`,
        joinParams,
      ),
      this.safeQueryOptional(
        `WITH expanded AS (SELECT s."companyId", unnest(s."spaceIds") AS "spaceIdText" FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where} AND s."spaceIds" IS NOT NULL) SELECT e."spaceIdText" AS "spaceId", COALESCE(sp.name, e."spaceIdText") AS name, COUNT(*)::int AS submissions FROM expanded e LEFT JOIN ${this.tableNames.space} sp ON sp.id::text = e."spaceIdText" AND sp."companyId"=$1 GROUP BY e."spaceIdText", name ORDER BY submissions DESC`,
        kpiParams,
      ),
      this.safeQueryOptional(
        `WITH expanded AS (SELECT s."companyId", unnest(s."groupIds") AS "groupIdText" FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where} AND s."groupIds" IS NOT NULL) SELECT e."groupIdText" AS "groupId", COALESCE(g.name, e."groupIdText") AS name, COUNT(*)::int AS submissions FROM expanded e LEFT JOIN ${this.tableNames.group} g ON g.id::text = e."groupIdText" AND g."companyId"=$1 GROUP BY e."groupIdText", name ORDER BY submissions DESC`,
        kpiParams,
      ),
      this.safeQueryOptional(
        `WITH reminder_sends AS (SELECT kind, ts AS sent_at FROM reminder_event WHERE "companyId"=$1 AND "formId"=$2::uuid AND type='sent' AND ts>=$3::timestamptz AND ts<($4::date + INTERVAL '1 day')), reminder_opens AS (SELECT kind, COUNT(id)::int AS opened FROM reminder_event WHERE "companyId"=$1 AND "formId"=$2::uuid AND type='opened' AND ts>=$3::timestamptz AND ts<($4::date + INTERVAL '1 day') GROUP BY kind), submissions_after AS (SELECT r.kind, COUNT(DISTINCT s.id)::int AS "submitsAfter" FROM reminder_sends r JOIN form_submission s ON s."companyId"=$1 AND s."formId"=$2::uuid AND s."submittedAt" >= r.sent_at AND s."submittedAt" < (r.sent_at + INTERVAL '48 hours') GROUP BY r.kind) SELECT rs.kind, COUNT(DISTINCT rs.sent_at)::int AS sent, COALESCE(ro.opened, 0)::int AS opened, COALESCE(sa."submitsAfter", 0)::int AS "submitsAfter" FROM reminder_sends rs LEFT JOIN reminder_opens ro ON ro.kind=rs.kind LEFT JOIN submissions_after sa ON sa.kind=rs.kind GROUP BY rs.kind, ro.opened, sa."submitsAfter" ORDER BY rs.kind`,
        dateParams,
      ),
      this.safeQueryOptional(
        `SELECT EXTRACT(DOW FROM s."submittedAt" AT TIME ZONE 'UTC') AS day, EXTRACT(HOUR FROM s."submittedAt" AT TIME ZONE 'UTC') AS hour, COUNT(*)::int FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where} GROUP BY 1, 2`,
        kpiParams,
      ),
      this.safeQueryOptional(
        `SELECT a.value FROM form_answer a JOIN form_submission s ON s.id=a."submissionId" JOIN form_field f ON f.id=a."fieldId" WHERE a."companyId"=$1 AND s."formId"=$2::uuid AND f.type IN ('short_text', 'long_text') AND a.value IS NOT NULL ${filters.where}`,
        kpiParams,
      ),
      this.safeQueryOptional(
        `WITH first_action AS (SELECT s.id AS "submissionId", MIN(a."createdAt") AS "firstActionAt" FROM form_submission s JOIN form_rh_action a ON a."submissionId"=s.id AND a."companyId"=s."companyId" WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where} GROUP BY s.id) SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY (EXTRACT(EPOCH FROM (fa."firstActionAt"-s."submittedAt"))*1000)) AS "firstResponseMsP50" FROM form_submission s JOIN first_action fa ON fa."submissionId"=s.id`,
        kpiParams,
      ),
    ]);

    const getResult = (i: number, opt = false) => {
      const res = results[i];
      if (res.status === 'fulfilled') return res.value;
      if (opt) {
        this.logger.warn(`Stats Query ${i} failed: ${res.reason}`);
        return [];
      }
      throw res.reason;
    };

    const form = getResult(0)?.[0];
    if (!form) throw new Error('Formulário não encontrado');
    const k = getResult(1)?.[0] ?? {};
    const eligibles = Number(getResult(2)?.[0]?.eligibles || 0);

    return {
      form,
      kpis: {
        eligibleUsers: eligibles,
        submissions: Number(k.submissions || 0),
        uniqueUsers: Number(k.uniqueUsers || 0),
        onTime: Number(k.onTime || 0),
        late: Math.max(Number(k.submissions || 0) - Number(k.onTime || 0), 0),
        external: Number(k.external || 0),
        attachments: Number(k.attachments || 0),
        rhReplies: Number(k.rhReplies || 0),
        pendingForRh: Number(k.pendingForRh || 0),
        firstResponseMsP50:
          getResult(12, true)?.[0]?.firstResponseMsP50 ?? null,
      },
      series: {
        activity: getResult(3),
        rh: getResult(4),
        notifications: getResult(5),
        attachments: getResult(6),
      },
      segments: {
        bySpace: getResult(7, true),
        byGroup: getResult(8, true),
        byAudience: [
          {
            type: 'internal',
            submits: Number(k.submissions || 0) - Number(k.external || 0),
          },
          { type: 'external', submits: Number(k.external || 0) },
        ],
      },
      reminders: getResult(9, true),
      heatmap: getResult(10, true),
      globalWordCloud: this.processWordCloud(getResult(11, true)),
    };
  }

  async getFieldsStats(
    companyId: string,
    formId: string,
    q: DateRange,
  ): Promise<FieldStat[]> {
    const { from, to } = this.normalizeRange(q);
    const fields = await this.safeQuery(
      `SELECT id, label, type, options FROM "form_field" WHERE "companyId"=$1 AND "formId"=$2::uuid ORDER BY "order" ASC`,
      [companyId, formId],
    );
    const results: FieldStat[] = [];

    for (const f of fields) {
      const baseParams = [companyId, formId, f.id];
      const filters = this.buildFilterWhere(q, 's', 4);
      const metricsParams = [companyId, formId, f.id, from, to];
      const fMetrics = await this.safeQueryOptional(
        `SELECT COUNT(*) FILTER (WHERE e.type='field_focus') AS focus, COUNT(*) FILTER (WHERE e.type='field_change') AS changes, COUNT(*) FILTER (WHERE e.type='field_validation_error') AS "validationErrors" FROM form_event e WHERE e."companyId"=$1 AND e."formId"=$2::uuid AND e."fieldId"=$3::uuid AND e.ts>=$4::timestamptz AND e.ts<($5::date + INTERVAL '1 day')`,
        metricsParams,
      );
      const m = fMetrics[0] ?? { focus: 0, changes: 0, validationErrors: 0 };

      let distribution: any = undefined;
      let wordCloud: any = {};

      if (
        ['single_choice', 'multi_choice', 'stars', 'scale'].includes(f.type)
      ) {
        const distData = await this.safeQueryOptional(
          `
          SELECT a.value, COUNT(a.id)::int AS count FROM form_answer a JOIN form_submission s ON s.id=a."submissionId"
          WHERE a."companyId"=$1 AND s."formId"=$2::uuid AND a."fieldId"=$3::uuid ${filters.where}
          GROUP BY a.value ORDER BY count DESC
        `,
          [...baseParams, ...filters.params],
        );

        if (f.type === 'multi_choice') {
          const counts = new Map<string, number>();
          distData.forEach((row: any) => {
            if (Array.isArray(row.value)) {
              row.value.forEach((v: string) =>
                counts.set(v, (counts.get(v) ?? 0) + row.count),
              );
            } else {
              const v = String(row.value);
              counts.set(v, (counts.get(v) ?? 0) + row.count);
            }
          });
          distribution = {
            choices: Array.from(counts.entries()).map(([value, count]) => ({
              value,
              count,
            })),
          };
        } else {
          distribution = { choices: distData };
        }
      }
      if (['short_text', 'long_text'].includes(f.type)) {
        const textData = await this.safeQueryOptional(
          `SELECT a.value FROM form_answer a JOIN form_submission s ON s.id=a."submissionId" WHERE a."companyId"=$1 AND s."formId"=$2::uuid AND a."fieldId"=$3::uuid ${filters.where}`,
          [...baseParams, ...filters.params],
        );
        wordCloud = this.processWordCloud(textData);
      }

      results.push({
        fieldId: f.id,
        label: f.label,
        type: f.type,
        metrics: {
          focus: Number(m.focus),
          changes: Number(m.changes),
          validationErrors: Number(m.validationErrors),
          errorRate:
            Number(m.focus) > 0
              ? Number(m.validationErrors) / Number(m.focus)
              : 0,
          avgTimeMs: 0,
          abandonAfterErrorRate: 0,
        },
        distribution,
        ...wordCloud,
      });
    }
    return results;
  }

  private processWordCloud(textData: Array<{ value: any }>): {
    topWords: any[];
    bigrams: any[];
    trigrams: any[];
  } {
    const allText = textData
      .map((r) => r.value)
      .filter((v) => typeof v === 'string' && v.trim().length > 2)
      .join(' ');
    if (allText.length === 0)
      return { topWords: [], bigrams: [], trigrams: [] };
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(allText.toLowerCase());
    const stopwords = new Set(natural.stopwords);
    const validTokens = tokens.filter(
      (t) => t.length > 2 && !stopwords.has(t) && isNaN(Number(t)),
    );
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(validTokens);
    const topWords = tfidf
      .listTerms(0)
      .slice(0, 100)
      .map((t: any) => ({ word: t.term, count: t.tf }));
    const Ngrams = natural.NGrams;
    const countOccurrences = (phrases: string[]) => {
      const counts = phrases.reduce(
        (acc, p) => {
          acc[p] = (acc[p] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
      return Object.entries(counts)
        .map(([phrase, count]) => ({ phrase, count }))
        .sort((a, b) => b.count - a.count);
    };
    return {
      topWords,
      bigrams: countOccurrences(
        Ngrams.bigrams(validTokens).map((g) => g.join(' ')),
      ).slice(0, 20),
      trigrams: countOccurrences(
        Ngrams.trigrams(validTokens).map((g) => g.join(' ')),
      ).slice(0, 20),
    };
  }

  async submissions(
    companyId: string,
    formId: string,
    q: DateRange,
    from: string,
    to: string,
    page: number,
    pageSize: number,
  ) {
    const filters = this.buildFilterWhere(q, 's', 3);
    const params = [companyId, formId, ...filters.params];
    const items = await this.safeQuery(
      `SELECT s.id AS "submissionId", s."submittedAt", s.status, s."isOnTime", s.external, s."externalEmail", s."fileCount", s."spaceIds", s."groupIds", s."userId", u.name AS "userName", jsonb_agg(jsonb_build_object('fieldId', a."fieldId", 'value', a.value, 'type', a.type)) FILTER (WHERE a.id IS NOT NULL) AS answers FROM form_submission s LEFT JOIN ${this.tableNames.user} u ON u.id::text=s."userId" LEFT JOIN form_answer a ON a."submissionId"=s.id WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where} GROUP BY s.id, u.name ORDER BY s."submittedAt" DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    );
    const totalRow = await this.safeQuery(
      `SELECT COUNT(*) AS c FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2::uuid ${filters.where}`,
      params,
    );
    return { total: Number(totalRow?.[0]?.c || 0), page, pageSize, items };
  }

  async analyticsGetLogs(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q);
    const logs = await this.safeQuery(
      `SELECT l.id, l."createdAt", l.action, l."formId", l."submissionId", l.changes, l."actorUserId", u.name AS "actorName" FROM form_audit_log l LEFT JOIN ${this.tableNames.user} u ON u.id::text = l."actorUserId" WHERE l."companyId"=$1 AND l."formId"=$2::uuid AND l."createdAt">=$3::timestamptz AND l."createdAt"<($4::date + INTERVAL '1 day') ORDER BY l."createdAt" DESC LIMIT 100`,
      [companyId, formId, from, to],
    );
    return { items: logs, total: logs.length };
  }

  async formNotifications(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q);
    const rows = await this.safeQuery(
      `SELECT id, "userId", channel, type, ts, meta FROM notification_event WHERE "companyId"=$1 AND "objectType"='form' AND "objectId"=$2::text AND ts>=$3::timestamptz AND ts<($4::date + INTERVAL '1 day') ORDER BY ts DESC LIMIT 200`,
      [companyId, formId, from, to],
    );
    return { items: rows };
  }

  async formReminders(companyId: string, formId: string, q: DateRange) {
    const { from, to } = this.normalizeRange(q);
    const events = await this.safeQuery(
      `SELECT id, "formId", kind, type, meta, ts FROM reminder_event WHERE "companyId"=$1 AND "formId"=$2::uuid AND ts>=$3::timestamptz AND ts<($4::date + INTERVAL '1 day') ORDER BY ts DESC`,
      [companyId, formId, from, to],
    );
    return { items: events };
  }

  // =================================================================
  // 🔥 BADGES INTELIGENTES (SLA + CHAT)
  // =================================================================
  async badges(companyId: string, cmsUserId: string) {
    // Lógica:
    // 1. Fazemos LEFT JOIN com form_badge_state para saber quando o RH viu por último (lastSeenAt).
    // 2. Contamos Submissões Novas (created > lastSeenAt).
    // 3. Contamos Chats de Usuário Novos (created > lastSeenAt).
    // 4. Somamos tudo.

    const sql = `
      WITH state AS (
         SELECT "formId", "lastSeenAt" 
         FROM form_badge_state 
         WHERE "companyId" = $1 AND "cmsUserId" = $2
      ),
      counts AS (
         SELECT 
            f.id as "formId",
            f.title->>COALESCE(f."defaultLocale", 'pt-BR') as title,
            COALESCE(st."lastSeenAt", '1970-01-01'::timestamptz) as last_seen,
            
            (SELECT COUNT(*) 
             FROM form_submission s 
             WHERE s."formId" = f.id 
               AND s."createdAt" > COALESCE(st."lastSeenAt", '1970-01-01'::timestamptz)
            )::int as new_subs,
            
            (SELECT COUNT(*) 
             FROM form_submission_chat c 
             JOIN form_submission s2 ON s2.id = c."submissionId"
             WHERE s2."formId" = f.id
               AND c.actor = 'user'
               AND c."createdAt" > COALESCE(st."lastSeenAt", '1970-01-01'::timestamptz)
            )::int as new_chats

         FROM form f
         LEFT JOIN state st ON st."formId" = f.id
         WHERE f."companyId" = $1 
           AND f.status = 'published'
      )
      SELECT 
        "formId", 
        title, 
        (new_subs + new_chats)::int as "newCount",
        last_seen as "lastSeenAt"
      FROM counts
      WHERE (new_subs + new_chats) > 0
      ORDER BY "newCount" DESC
    `;

    const rows = await this.ds.query(sql, [companyId, cmsUserId]);

    const totalNew = rows.reduce(
      (acc: number, r: any) => acc + (r.newCount || 0),
      0,
    );

    return {
      totalNew,
      byForm: rows,
    };
  }

  async ackBadges(
    companyId: string,
    cmsUserId: string,
    body: { formId?: string; all?: boolean },
  ) {
    // "Resolver": Atualiza o lastSeenAt para AGORA. Isso zera a contagem da query acima.
    if (body.all) {
      await this.safeQuery(
        `UPDATE form_badge_state SET "lastSeenAt" = now(), "newCount" = 0 WHERE "companyId" = $1 AND "cmsUserId" = $2`,
        [companyId, cmsUserId],
      );
    } else if (body.formId) {
      await this.ds.query(
        `INSERT INTO form_badge_state("companyId", "cmsUserId", "formId", "lastSeenAt", "newCount") 
         VALUES ($1, $2, $3, now(), 0) 
         ON CONFLICT ("companyId", "cmsUserId", "formId") 
         DO UPDATE SET "lastSeenAt" = now(), "newCount" = 0`,
        [companyId, cmsUserId, body.formId],
      );
    }
    return { ok: true };
  }

  async exportAnalytics(companyId: string, body: ExportBody): Promise<Buffer> {
    const { from, to } = this.normalizeRange(body.filters ?? {});
    const filters = body.filters ?? {};
    const [overviewData, listData, statsData, submissionsData, fieldsData] =
      await Promise.all([
        this.overview(companyId, filters),
        this.list(companyId, { ...filters, page: 1, pageSize: 99999 }),
        body.formId
          ? this.formStats(companyId, body.formId, filters)
          : Promise.resolve(null),
        body.formId
          ? this.submissions(
              companyId,
              body.formId,
              filters,
              from,
              to,
              1,
              99999,
            )
          : Promise.resolve(null),
        body.formId
          ? this.getFieldsStats(companyId, body.formId, filters)
          : Promise.resolve(null),
      ]);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Iuppy';
    workbook.created = new Date();
    const overviewSheet = workbook.addWorksheet('Overview');
    overviewSheet.addRow(['Métrica', 'Valor']);
    overviewSheet.addRow(['Total Formulários', overviewData.kpis.totalForms]);
    overviewSheet.addRow([
      'Total Submissões',
      overviewData.kpis.totalSubmissions,
    ]);
    const listSheet = workbook.addWorksheet('Lista de Forms');
    listSheet.columns = [
      { header: 'Formulário', key: 'title' },
      { header: 'Status', key: 'status' },
      { header: 'Envios', key: 'submissions' },
      { header: '% No Prazo', key: 'onTimeRate' },
    ];
    listSheet.addRows(
      (listData.items as any[]).map((r: any) => ({
        ...r,
        title: getTranslation(r.title, 'pt-BR'),
        onTimeRate: (r.onTimeRate * 100).toFixed(1),
      })),
    );
    if (body.formId && statsData && submissionsData && fieldsData) {
      const subSheet = workbook.addWorksheet('Submissões');
      const headers = fieldsData.map((f) => ({
        header: getTranslation(f.label, 'pt-BR'),
        key: f.fieldId,
      }));
      subSheet.columns = [
        { header: 'ID', key: 'submissionId' },
        { header: 'Usuário', key: 'userName' },
        { header: 'Data', key: 'submittedAt' },
        ...headers,
      ];
      subSheet.addRows(
        (submissionsData.items as any[]).map((s: any) => {
          const row: any = { ...s, userName: s.userName ?? s.userId };
          (s.answers || []).forEach(
            (a: any) =>
              (row[a.fieldId] = Array.isArray(a.value)
                ? a.value.join(', ')
                : a.value),
          );
          return row;
        }),
      );
    }
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
  async jobs(companyId: string) {
    const lastReminders = await this.safeQuery(
      `SELECT MAX(ts) AS "lastRun" FROM reminder_event WHERE "companyId" = $1`,
      [companyId],
    );
    return {
      queues: [],
      uptime: 86400,
      lastRun: lastReminders?.[0]?.lastRun ?? null,
    };
  }
}
function getTranslation(
  field: TranslatableString | string | null | undefined,
  locale: string,
): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[locale] || field['pt-BR'] || field[Object.keys(field)[0]] || '';
}
