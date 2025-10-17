import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';

import { NewsEntity } from 'src/news/news.entity';
import { NewsReactionEntity } from 'src/v2/interactions/entities/news-reaction.entity';
import { NewsCommentEntity } from 'src/v2/interactions/entities/news-comment.entity';
import { NewsShareEntity } from 'src/v2/interactions/entities/news-share.entity';
import { NewsMetricsDailyEntity } from 'src/v2/interactions/entities/news-metrics-daily.entity';
import { UserMetricsDailyEntity } from 'src/v2/interactions/entities/user-metrics-daily.entity';
import { SearchMetricsDailyEntity } from 'src/v2/interactions/entities/search-metrics-daily.entity';
import { NewsAudienceEntity } from 'src/v2/interactions/entities/news-audience.entity';

import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';
import { PushDeliveryEntity } from '../push/entities/push-delivery.entity';

type NewsOverviewParams = {
  from?: string
  to?: string
  spaceId?: string
  channelId?: string
  groupId?: string
}
type ReactionKind = 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

function toDateISO(d?: string): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

// 🔐 helper para citar identificadores (colunas) com segurança
function q(ident: string) {
  return `"${String(ident).replace(/"/g, '""')}"`;
}

@Injectable()
export class AnalyticsV2Service {
  constructor(
    @InjectRepository(NewsEntity) private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(NewsReactionEntity) private readonly reactionRepo: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity) private readonly commentRepo: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity) private readonly shareRepo: Repository<NewsShareEntity>,
    @InjectRepository(NewsMetricsDailyEntity) private readonly nDailyRepo: Repository<NewsMetricsDailyEntity>,
    @InjectRepository(UserMetricsDailyEntity) private readonly uDailyRepo: Repository<UserMetricsDailyEntity>,
    @InjectRepository(SearchMetricsDailyEntity) private readonly sDailyRepo: Repository<SearchMetricsDailyEntity>,
    @InjectRepository(PushDeliveryEntity) private readonly pushRepo: Repository<PushDeliveryEntity>,
    @InjectRepository(NewsAudienceEntity) private readonly audienceRepo: Repository<NewsAudienceEntity>,
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2,
  ) { }

  // ========= infra =========

  private async detectEventMeta(): Promise<{
    table: string;
    typeCol: string;
    newsRef: string;
    userIdCol: string;
    createdAtCol: string;
    metaCol?: string | null;
  } | null> {
    const r = await this.newsRepo.query(
      `SELECT to_regclass('public.news_interaction_event') AS nie, to_regclass('public.interaction_event') AS ie`,
    );
    const table =
      (r && r[0] && r[0].nie && 'news_interaction_event') ||
      (r && r[0] && r[0].ie && 'interaction_event') ||
      null;

    if (!table) return null;

    const cols = await this.newsRepo.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [table],
    );
    const names: string[] = (cols || []).map((c: any) => c.column_name);
    const typeCol = names.includes('type') ? 'type' : names.includes('event') ? 'event' : null;
    const newsRef = names.includes('newsId') ? 'newsId' : names.includes('objectId') ? 'objectId' : null;
    const userIdCol = names.includes('userId') ? 'userId' : null;
    const createdAtCol = names.includes('createdAt') ? 'createdAt' : names.includes('created_at') ? 'created_at' : null;
    const metaCol = names.includes('meta') ? 'meta' : null;

    if (!typeCol || !newsRef || !userIdCol || !createdAtCol) return null;
    return { table, typeCol, newsRef, userIdCol, createdAtCol, metaCol };
  }

  private buildBetweenClause(
    colIdent: string,
    startIndex: number,
    from?: string,
    to?: string,
  ): { sql: string; params: any[]; nextIndex: number } {
    const f = toDateISO(from);
    const t = toDateISO(to);
    let sql = '';
    const params: any[] = [];
    let idx = startIndex;

    if (f) {
      sql += ` AND ${colIdent} >= $${idx}`;
      params.push(f);
      idx++;
    }
    if (t) {
      sql += ` AND ${colIdent} < ($${idx}::date + INTERVAL '1 day')`;
      params.push(t);
      idx++;
    }
    return { sql, params, nextIndex: idx };
  }

  /** Detecta se o esquema de comentários usa 'status' (legado) ou 'approved' (atual). */
  private async detectCommentModerationColumn(): Promise<'status' | 'approved'> {
    try {
      const rows = await this.ds.query(
        `SELECT column_name
           FROM information_schema.columns
          WHERE table_schema='public' AND table_name='news_comment'
            AND column_name IN ('status','approved')`
      );
      const names: string[] = rows?.map((r: any) => r.column_name) ?? [];
      if (names.includes('status')) return 'status';
      return 'approved';
    } catch {
      return 'approved';
    }
  }

  // =========================
  //     /v2/news/:id/metrics
  // =========================
  async newsMetrics(companyId: string, newsId: string, from?: string, to?: string) {
    // recebível = audiência ∩ tokens habilitados (fallback: conta audiência)
    let recebivel = 0;
    try {
      const r = await this.ds.query(
        `
        SELECT COUNT(DISTINCT ud."userId")::int AS c
          FROM news_audience a
          JOIN user_device ud
            ON ud."companyId"=a."companyId"
           AND ud."userId"=a."userId"
           AND ud."enabled"=true
         WHERE a."companyId"=$1 AND a."newsId"=$2
        `,
        [companyId, newsId],
      );
      recebivel = Number(r?.[0]?.c || 0);
    } catch {
      recebivel = await this.audienceRepo.count({ where: { companyId, newsId } });
    }

    // quantos push (se tabela existir)
    let recebeuPush = 0;
    try {
      recebeuPush = await this.pushRepo.count({ where: { companyId, newsId } });
    } catch {
      recebeuPush = 0;
    }

    // reações por tipo
    const reactionsRows = await this.reactionRepo.query(
      `SELECT "reaction" AS r, COUNT(*)::int AS c
       FROM news_reaction
       WHERE "newsId"=$1 AND "companyId"=$2
       GROUP BY "reaction"`,
      [newsId, companyId],
    );
    const reactionsByType: Record<ReactionKind, number> = {
      like: 0, love: 0, clap: 0, smile: 0, neutral: 0, angry: 0,
    };
    for (const row of reactionsRows || []) {
      const key = String(row.r) as ReactionKind;
      if (key in reactionsByType) reactionsByType[key] = Number(row.c || 0);
    }

    // comentários (compat status/approved)
    let comments = { total: 0, pending: 0, approved: 0, rejected: 0 };
    try {
      const col = await this.detectCommentModerationColumn();
      let sql = '';
      if (col === 'status') {
        sql = `
          SELECT
            COUNT(*)::int AS total,
            SUM((status='pending')::int)::int AS pending,
            SUM((status='approved')::int)::int AS approved,
            SUM((status='rejected')::int)::int AS rejected
          FROM news_comment
          WHERE "newsId"=$1 AND "companyId"=$2`;
      } else {
        // approved: null=pending, true=approved, false=rejected
        sql = `
          SELECT
            COUNT(*)::int AS total,
            SUM((approved IS NULL)::int)::int AS pending,
            SUM((approved = true)::int)::int AS approved,
            SUM((approved = false)::int)::int AS rejected
          FROM news_comment
          WHERE "newsId"=$1 AND "companyId"=$2`;
      }
      const agg = await this.commentRepo.query(sql, [newsId, companyId]);
      comments = (agg && agg[0]) ? {
        total: Number(agg[0].total || 0),
        pending: Number(agg[0].pending || 0),
        approved: Number(agg[0].approved || 0),
        rejected: Number(agg[0].rejected || 0),
      } : comments;
    } catch { /* noop */ }

    // opens/unique/acks
    let totalOpens = 0, uniqueOpens = 0, acks = 0;
    const meta = await this.detectEventMeta();
    if (meta) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;

      {
        const baseParams = [companyId, newsId];
        const between = this.buildBetweenClause(q(createdAtCol), 3, from, to);
        const sql =
          `SELECT COUNT(*)::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND ${q(newsRef)}=$2
             AND (UPPER(${q(typeCol)}::text) = 'OPEN')` + between.sql;
        const rows = await this.newsRepo.query(sql, baseParams.concat(between.params));
        totalOpens = rows?.[0]?.c ?? 0;
      }
      {
        const baseParams = [companyId, newsId];
        const between = this.buildBetweenClause(q(createdAtCol), 3, from, to);
        const sql =
          `SELECT COUNT(DISTINCT ${q(userIdCol)})::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND ${q(newsRef)}=$2
             AND (UPPER(${q(typeCol)}::text) = 'OPEN')` + between.sql;
        const rows = await this.newsRepo.query(sql, baseParams.concat(between.params));
        uniqueOpens = rows?.[0]?.c ?? 0;
      }
      {
        const baseParams = [companyId, newsId];
        const between = this.buildBetweenClause(q(createdAtCol), 3, from, to);
        const sql =
          `SELECT COUNT(DISTINCT ${q(userIdCol)})::int AS c
           FROM ${table}
           WHERE "companyId"=$1 AND ${q(newsRef)}=$2
             AND (UPPER(${q(typeCol)}::text) = 'ACK')` + between.sql;
        const rows = await this.newsRepo.query(sql, baseParams.concat(between.params));
        acks = rows?.[0]?.c ?? 0;
      }
    } else {
      const rows = await this.nDailyRepo.find({ where: { newsId } });
      if (rows?.length) {
        totalOpens = rows.reduce((s, r) => s + (r.opens || 0), 0);
        uniqueOpens = rows.reduce((s, r) => s + (r.uniqueOpens || 0), 0);
        acks = rows.reduce((s, r) => s + (r.acks || 0), 0);
      }
    }

    // série diária
    const f = toDateISO(from);
    const t = toDateISO(to);
    const params: any[] = [newsId];
    let sql =
      `SELECT to_char(d."date",'YYYY-MM-DD') AS date,
              d.opens::int, d."uniqueOpens"::int, d.acks::int,
              d.reactions::int, d.comments::int, d.shares::int
       FROM news_metrics_daily d
       WHERE d."newsId"=$1`;
    let nextIndex = 2;
    if (f) { sql += ` AND d."date" >= $${nextIndex}`; params.push(f); nextIndex++; }
    if (t) { sql += ` AND d."date" < ($${nextIndex}::date + INTERVAL '1 day')`; params.push(t); nextIndex++; }
    sql += ` ORDER BY d."date" ASC`;
    const seriesDaily = await this.nDailyRepo.query(sql, params);

    // heatmap por hora/dia — ajustado por tz local (meta.tzOffsetMinutes) quando disponível
    let heatmap: Array<{ hour: number; dow: number; count: number }> = [];
    const metaEv = await this.detectEventMeta();
    if (metaEv) {
      const { table, typeCol, createdAtCol, newsRef } = metaEv;

      // existe coluna 'meta'?
      const hasMetaColRows = await this.ds.query(
        `SELECT 1
           FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1 AND column_name='meta'
          LIMIT 1`,
        [table],
      );
      const hasMetaCol = !!hasMetaColRows?.length;

      const baseParams = [companyId, newsId];
      const between = this.buildBetweenClause(q(createdAtCol), 3, from, to);

      let hsql: string;
      if (hasMetaCol) {
        hsql =
          `SELECT
             EXTRACT(HOUR FROM (${q(createdAtCol)} + make_interval(mins => COALESCE((meta->>'tzOffsetMinutes')::int,0))))::int AS hour,
             EXTRACT(DOW  FROM (${q(createdAtCol)} + make_interval(mins => COALESCE((meta->>'tzOffsetMinutes')::int,0))))::int AS dow,
             COUNT(*)::int AS count
           FROM ${table}
           WHERE "companyId"=$1 AND ${q(newsRef)}=$2
             AND (UPPER(${q(typeCol)}::text) = 'OPEN')` + between.sql + ` GROUP BY 1,2 ORDER BY 2,1`;
      } else {
        // fallback: UTC
        hsql =
          `SELECT EXTRACT(HOUR FROM ${q(createdAtCol)})::int AS hour,
                  EXTRACT(DOW  FROM ${q(createdAtCol)})::int AS dow,
                  COUNT(*)::int AS count
           FROM ${table}
           WHERE "companyId"=$1 AND ${q(newsRef)}=$2
             AND (UPPER(${q(typeCol)}::text) = 'OPEN')` + between.sql + ` GROUP BY 1,2 ORDER BY 2,1`;
      }
      heatmap = await this.newsRepo.query(hsql, baseParams.concat(between.params));
    }

    // LATÊNCIAS (push_delivery + primeiro OPEN)
    let latency: any = {
      sentToDelivered: { avgMs: null, p50Ms: null, p95Ms: null },
      sentToOpen: { avgMs: null, p50Ms: null, p95Ms: null },
    };
    try {
      const qlat =
        `WITH first_open AS (
           SELECT e."companyId", e."newsId", e."userId", MIN(e."createdAt") AS openedAt
             FROM news_interaction_event e
            WHERE e."companyId"=$1 AND e."newsId"=$2 AND UPPER(e."type"::text)='OPEN'
            GROUP BY 1,2,3
         ),
         base AS (
           SELECT d."createdAt" AS sentAt,
                  COALESCE(d."deliveredAt", d."createdAt") AS deliveredAt,
                  fo.openedAt AS openedAt
             FROM push_delivery d
        LEFT JOIN first_open fo
               ON fo."companyId"=d."companyId" AND fo."newsId"=d."newsId" AND fo."userId"=d."userId"
            WHERE d."companyId"=$1 AND d."newsId"=$2
         )
         SELECT
           AVG(EXTRACT(EPOCH FROM (deliveredAt - sentAt))*1000) AS sent_delivered_avg,
           percentile_disc(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (deliveredAt - sentAt))*1000) AS sent_delivered_p50,
           percentile_disc(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (deliveredAt - sentAt))*1000) AS sent_delivered_p95,
           AVG(EXTRACT(EPOCH FROM (openedAt - sentAt))*1000) AS sent_open_avg,
           percentile_disc(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (openedAt - sentAt))*1000) AS sent_open_p50,
           percentile_disc(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (openedAt - sentAt))*1000) AS sent_open_p95
         FROM base
         WHERE sentAt IS NOT NULL`;
      const r = await this.ds.query(qlat, [companyId, newsId]);
      const row = r?.[0] || {};
      const num = (v: any) => (v == null ? null : Math.round(Number(v)));
      latency = {
        sentToDelivered: { avgMs: num(row.sent_delivered_avg), p50Ms: num(row.sent_delivered_p50), p95Ms: num(row.sent_delivered_p95) },
        sentToOpen: { avgMs: num(row.sent_open_avg), p50Ms: num(row.sent_open_p50), p95Ms: num(row.sent_open_p95) },
      };
    } catch { /* noop */ }

    const reactionsTotal = Object.values(reactionsByType).reduce((s, v) => s + (v || 0), 0);

    return {
      newsId,
      recebivel,
      recebeuPush,
      totalOpens,
      uniqueOpens,
      acks,
      reactionsByType,
      comments,
      seriesDaily,
      heatmap,
      latency,
      reactionsTotal,
      commentsTotal: Number(comments.total || 0),
      sharesTotal: await this.shareRepo.count({ where: { companyId, newsId } }),
    };
  }

  // =========================
  //   /v2/news/metrics?ids=a,b,c
  // =========================
  async batchNewsMetrics(
    companyId: string,
    ids: string[],
    from?: string,
    to?: string,
  ): Promise<Record<string, any>> {
    if (!ids.length) return {};
    const newsIds = ids.slice(0, 200);
    const meta = await this.detectEventMeta();

    const recebivelRows = await this.audienceRepo.query(
      `SELECT "newsId", COUNT(*)::int AS c
         FROM news_audience
        WHERE "companyId" = $1 AND "newsId" = ANY($2)
        GROUP BY "newsId"`,
      [companyId, newsIds],
    );

    let pushRows: any[] = [];
    try {
      pushRows = await this.pushRepo.query(
        `SELECT "newsId", COUNT(*)::int AS c
           FROM push_delivery
          WHERE "companyId" = $1 AND "newsId" = ANY($2)
          GROUP BY "newsId"`,
        [companyId, newsIds],
      );
    } catch { /* ignore */ }

    const reactsRows = await this.reactionRepo.query(
      `SELECT "newsId", reaction, COUNT(*)::int AS c
         FROM news_reaction
        WHERE "companyId"=$1 AND "newsId" = ANY($2)
        GROUP BY "newsId", reaction`,
      [companyId, newsIds],
    );

    const commentsRows = await this.commentRepo.query(
      `SELECT "newsId", COUNT(*)::int AS c
         FROM news_comment
        WHERE "companyId"=$1 AND "newsId" = ANY($2)
        GROUP BY "newsId"`,
      [companyId, newsIds],
    );

    const sharesRows = await this.shareRepo.query(
      `SELECT "newsId", COUNT(*)::int AS c
         FROM news_share
        WHERE "companyId"=$1 AND "newsId" = ANY($2)
        GROUP BY "newsId"`,
      [companyId, newsIds],
    );

    let opensRows: any[] = [];
    let uniqueRows: any[] = [];
    let acksRows: any[] = [];

    if (meta) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;
      const betweenOpen = this.buildBetweenClause(q(createdAtCol), 3, from, to);
      const betweenAck = this.buildBetweenClause(q(createdAtCol), 3, from, to);

      {
        const sql =
          `SELECT ${q(newsRef)} AS "newsId", COUNT(*)::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND ${q(newsRef)} = ANY($2)
              AND (UPPER(${q(typeCol)}::text) = 'OPEN')` + betweenOpen.sql +
          ` GROUP BY ${q(newsRef)}`;
        opensRows = await this.newsRepo.query(sql, [companyId, newsIds].concat(betweenOpen.params));
      }
      {
        const sql =
          `SELECT ${q(newsRef)} AS "newsId", COUNT(DISTINCT ${q(userIdCol)})::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND ${q(newsRef)} = ANY($2)
              AND (UPPER(${q(typeCol)}::text) = 'OPEN')` + betweenOpen.sql +
          ` GROUP BY ${q(newsRef)}`;
        uniqueRows = await this.newsRepo.query(sql, [companyId, newsIds].concat(betweenOpen.params));
      }
      {
        const sql =
          `SELECT ${q(newsRef)} AS "newsId", COUNT(DISTINCT ${q(userIdCol)})::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND ${q(newsRef)} = ANY($2)
              AND (UPPER(${q(typeCol)}::text) = 'ACK')` + betweenAck.sql +
          ` GROUP BY ${q(newsRef)}`;
        acksRows = await this.newsRepo.query(sql, [companyId, newsIds].concat(betweenAck.params));
      }
    } else {
      const daily = await this.nDailyRepo.find({ where: { newsId: In(newsIds) } });
      const byId = new Map<string, { opens: number; unique: number; acks: number }>();
      for (const r of daily) {
        const k = (r as any).newsId as string;
        const prev = byId.get(k) || { opens: 0, unique: 0, acks: 0 };
        prev.opens += (r as any).opens || 0;
        prev.unique += (r as any).uniqueOpens || 0;
        prev.acks += (r as any).acks || 0;
        byId.set(k, prev);
      }
      opensRows = Array.from(byId.entries()).map(([newsId, v]) => ({ newsId, c: v.opens }));
      uniqueRows = Array.from(byId.entries()).map(([newsId, v]) => ({ newsId, c: v.unique }));
      acksRows = Array.from(byId.entries()).map(([newsId, v]) => ({ newsId, c: v.acks }));
    }

    const out: Record<string, any> = {};
    for (const id of newsIds) {
      out[id] = {
        newsId: id,
        recebivel: 0,
        recebeuPush: 0,
        totalOpens: 0,
        uniqueOpens: 0,
        acks: 0,
        reactionsByType: { like: 0, love: 0, clap: 0, smile: 0, neutral: 0, angry: 0 } as Record<ReactionKind, number>,
        reactionsTotal: 0,
        commentsTotal: 0,
        sharesTotal: 0,
      };
    }

    for (const r of recebivelRows || []) if (out[r.newsId]) out[r.newsId].recebivel = Number(r.c || 0);
    for (const r of pushRows || []) if (out[r.newsId]) out[r.newsId].recebeuPush = Number(r.c || 0);
    for (const r of commentsRows || []) if (out[r.newsId]) out[r.newsId].commentsTotal = Number(r.c || 0);
    for (const r of sharesRows || []) if (out[r.newsId]) out[r.newsId].sharesTotal = Number(r.c || 0);
    for (const r of opensRows || []) if (out[r.newsId]) out[r.newsId].totalOpens = Number(r.c || 0);
    for (const r of uniqueRows || []) if (out[r.newsId]) out[r.newsId].uniqueOpens = Number(r.c || 0);
    for (const r of acksRows || []) if (out[r.newsId]) out[r.newsId].acks = Number(r.c || 0);

    for (const r of reactsRows || []) {
      const id = r.newsId as string;
      const key = String(r.reaction) as ReactionKind;
      const c = Number(r.c || 0);
      if (out[id]) {
        if (key in out[id].reactionsByType) {
          out[id].reactionsByType[key] += c;
        }
      }
    }
    for (const id of Object.keys(out)) {
      out[id].reactionsTotal = Object.values(out[id].reactionsByType).reduce((s: number, v: number) => s + (v || 0), 0);
    }

    return out;
  }

  // =========================
  //   /analytics/users/overview
  // =========================
  async usersOverview(
    companyId: string,
    params: { from?: string; to?: string; spaceId?: string; channelId?: string; groupId?: string },
  ) {
    const f = toDateISO(params.from);
    const t = toDateISO(params.to);

    const totalUsersRow = await this.newsRepo.query(
      `SELECT COUNT(*)::int AS c FROM users WHERE "companyId"=$1`,
      [companyId],
    );
    const totalColaboradores = totalUsersRow?.[0]?.c ? Number(totalUsersRow[0].c) : 0;

    const registradosApp = totalColaboradores; // placeholder

    const p: any[] = [];
    let sql =
      `SELECT
         COUNT(DISTINCT "userId")::int AS ativos,
         COUNT(DISTINCT CASE WHEN (appOpens + newsOpens + reactions + comments + shares + surveyResponses) > 0 THEN "userId" END)::int AS engajados
       FROM user_metrics_daily
       WHERE 1=1`;
    let idx = 1;
    if (f) { sql += ` AND "date" >= $${idx}`; p.push(f); idx++; }
    if (t) { sql += ` AND "date" < ($${idx}::date + INTERVAL '1 day')`; p.push(t); idx++; }
    const rows = await this.uDailyRepo.query(sql, p);

    const ativosPeriodo = rows?.[0]?.ativos ? Number(rows[0].ativos) : 0;
    const engajadosPeriodo = rows?.[0]?.engajados ? Number(rows[0].engajados) : 0;

    const funnelPct = {
      registrados: totalColaboradores ? Math.round((registradosApp / totalColaboradores) * 100) : 0,
      ativos: totalColaboradores ? Math.round((ativosPeriodo / totalColaboradores) * 100) : 0,
      engajados: totalColaboradores ? Math.round((engajadosPeriodo / totalColaboradores) * 100) : 0,
    };

    return {
      period: { from: f ?? null, to: t ?? null },
      totalColaboradores,
      registradosApp,
      ativosPeriodo,
      engajadosPeriodo,
      funnelPct,
      heatmapAppOpen: [],
      topInteractions: [
        { type: 'open', count: 0 },
        { type: 'ack', count: 0 },
        { type: 'reaction', count: 0 },
        { type: 'comment', count: 0 },
        { type: 'share', count: 0 },
      ],
    };
  }

  // =========================
  //   /analytics/search/overview
  // =========================
  async searchOverview(companyId: string, params: { from?: string; to?: string }) {
    const f = toDateISO(params.from);
    const t = toDateISO(params.to);

    const p1: any[] = [companyId];
    let sql1 =
      `SELECT
         COALESCE(SUM(queries),0)::int AS totalQueries,
         COALESCE(SUM(uniqueUsers),0)::int AS uniqueUsers
       FROM search_metrics_daily
       WHERE "companyId"=$1`;
    let idx1 = 2;
    if (f) { sql1 += ` AND "date" >= $${idx1}`; p1.push(f); idx1++; }
    if (t) { sql1 += ` AND "date" < ($${idx1}::date + INTERVAL '1 day')`; p1.push(t); idx1++; }
    const rows1 = await this.sDailyRepo.query(sql1, p1);

    const p2: any[] = [companyId];
    let sql2 =
      `SELECT "queryHash" AS hash,
              MAX("sampleQuery") AS sample,
              SUM(queries)::int AS count,
              SUM(uniqueUsers)::int AS "uniqueUsers"
       FROM search_metrics_daily
       WHERE "companyId"=$1`;
    let idx2 = 2;
    if (f) { sql2 += ` AND "date" >= $${idx2}`; p2.push(f); idx2++; }
    if (t) { sql2 += ` AND "date" < ($${idx2}::date + INTERVAL '1 day')`; p2.push(t); idx2++; }
    sql2 += ` GROUP BY "queryHash" ORDER BY count DESC LIMIT 20`;
    const rows2 = await this.sDailyRepo.query(sql2, p2);

    return {
      period: { from: f ?? null, to: t ?? null },
      totalQueries: rows1?.[0]?.totalQueries ? Number(rows1[0].totalQueries) : 0,
      uniqueUsers: rows1?.[0]?.uniqueUsers ? Number(rows1[0].uniqueUsers) : 0,
      topQueries: rows2 || [],
    };
  }

  // =========================
  //   /analytics/news/overview
  // =========================
  async newsOverview(
    companyId: string,
    { from, to, spaceId, channelId, groupId }: NewsOverviewParams,
  ) {
    const qq = (s: string) => (s.includes('"') ? s : `"${s}"`);
    const hasNewsSpaceId = await this.schema.hasColumn('news_entity', 'spaceId');
    const hasStatusCol = await this.schema.hasColumn('news_entity', 'status');
    const hasIsPublishedCol = await this.schema.hasColumn('news_entity', 'isPublished');

    let select = `SELECT n.id, n.title, n."channelId", n."createdAt"`;
    let fromClause = `FROM news_entity n`;
    const where: string[] = [`n."companyId" = $1`];
    if (hasStatusCol) {
      where.push(`n.status = 'published'`);
    } else if (hasIsPublishedCol) {
      where.push(`COALESCE(n."isPublished", true) = true`);
    }
    const params: any[] = [companyId];
    let i = params.length + 1;

    if (from) {
      where.push(`n."createdAt" >= $${i++}`);
      params.push(from);
    }
    if (to) {
      where.push(`n."createdAt" < ($${i++}::date + INTERVAL '1 day')`);
      params.push(to);
    }

    if (spaceId) {
      if (hasNewsSpaceId) {
        select += `, n."spaceId"`;
        where.push(`n."spaceId" = $${i++}`);
        params.push(spaceId);
      } else {
        fromClause += ` JOIN channel c ON c.id::text = n."channelId"::text`;
        const selIdx = i++;
        select += `, CAST($${selIdx} AS uuid) AS "spaceId"`;
        params.push(spaceId);
        const whereIdx = i++;
        where.push(`CAST($${whereIdx} AS text) = ANY(c."space_ids"::text[])`);
        params.push(spaceId);
      }
    }

    if (channelId) {
      where.push(`n."channelId" = $${i++}`);
      params.push(channelId);
    }

    const newsSql = `${select}
${fromClause}
WHERE ${where.join(' AND ')}`;

    const newsRows: Array<{
      id: string
      title: string
      channelId: string
      createdAt: string
      spaceId?: string
    }> = await this.ds.query(newsSql, params);

    if (newsRows.length === 0) {
      return {
        openRate30d: 0,
        ackRate30d: 0,
        reactionsPerBase: 0,
        totalInteractions: 0,
        items: [],
      };
    }

    const ids = newsRows.map(r => r.id);
    const ph = ids.map((_, idx) => `$${idx + 1}`).join(',');
    const baseParams = [...ids];

    const evMap = await this.schema.detectEventMap();
    let opensById = new Map<string, number>();
    let acksById = new Map<string, number>();
    if (evMap) {
      const evSql = `
        SELECT ${qq(evMap.newsIdCol)} AS nid, LOWER(${qq(evMap.typeCol)}::text) AS etype, COUNT(1)::int AS cnt
          FROM ${evMap.table}
         WHERE ${qq(evMap.newsIdCol)} IN (${ph})
           AND "companyId" = $${baseParams.length + 1}
           ${from ? `AND ${qq(evMap.createdAtCol)} >= $${baseParams.length + 2}` : ''}
           ${to ? `AND ${qq(evMap.createdAtCol)} < ($${baseParams.length + (from ? 3 : 2)}::date + INTERVAL '1 day')` : ''}
         GROUP BY 1,2
      `;
      const evParams = [
        ...baseParams,
        companyId,
        ...(from ? [from] : []),
        ...(to ? [to] : []),
      ];
      const evRows: Array<{ nid: string; etype: string; cnt: number }> = await this.ds.query(evSql, evParams);
      opensById = new Map(evRows.filter(r => r.etype === 'open').map(r => [r.nid, r.cnt]));
      acksById = new Map(evRows.filter(r => r.etype === 'ack' || r.etype === 'acknowledge').map(r => [r.nid, r.cnt]));
    }

    let reactsById = new Map<string, number>();
    if (await this.schema.hasTable('news_reaction')) {
      const rSql = `
        SELECT "newsId" AS nid, COUNT(1)::int AS cnt
          FROM news_reaction
         WHERE "newsId" IN (${ph})
           AND "companyId" = $${baseParams.length + 1}
           ${from ? `AND "createdAt" >= $${baseParams.length + 2}` : ''}
           ${to ? `AND "createdAt" < ($${baseParams.length + (from ? 3 : 2)}::date + INTERVAL '1 day')` : ''}
         GROUP BY "newsId"
      `;
      const rParams = [
        ...baseParams,
        companyId,
        ...(from ? [from] : []),
        ...(to ? [to] : []),
      ];
      const rRows: Array<{ nid: string; cnt: number }> = await this.ds.query(rSql, rParams);
      reactsById = new Map(rRows.map(r => [r.nid, r.cnt]));
    }

    let commentsById = new Map<string, number>();
    if (await this.schema.hasTable('news_comment')) {
      const cm = await this.schema.detectCommentMap();
      const cSql = `
        SELECT "newsId" AS nid, COUNT(1)::int AS cnt
          FROM ${cm!.table}
         WHERE "newsId" IN (${ph})
           AND "companyId" = $${baseParams.length + 1}
           ${from ? `AND ${qq(cm!.createdAtCol)} >= $${baseParams.length + 2}` : ''}
           ${to ? `AND ${qq(cm!.createdAtCol)} < ($${baseParams.length + (from ? 3 : 2)}::date + INTERVAL '1 day')` : ''}
         GROUP BY "newsId"
      `;
      const cParams = [
        ...baseParams,
        companyId,
        ...(from ? [from] : []),
        ...(to ? [to] : []),
      ];
      const cRows: Array<{ nid: string; cnt: number }> = await this.ds.query(cSql, cParams);
      commentsById = new Map(cRows.map(r => [r.nid, r.cnt]));
    }

    const items = newsRows.map(n => ({
      id: n.id,
      title: n.title,
      channelId: n.channelId,
      spaceId: n.spaceId ?? spaceId ?? null,
      createdAt: n.createdAt,
      metrics: {
        open: opensById.get(n.id) ?? 0,
        ack: acksById.get(n.id) ?? 0,
        reactions: reactsById.get(n.id) ?? 0,
        comments: commentsById.get(n.id) ?? 0,
        shares: 0,
      },
    }));

    const base = items.length || 1;
    const openRate30d = (items.reduce((s, it) => s + it.metrics.open, 0) / base) / 100;
    const ackRate30d = (items.reduce((s, it) => s + it.metrics.ack, 0) / base) / 100;
    const reactionsPerBase = (items.reduce((s, it) => s + it.metrics.reactions, 0) / base) / 100;
    const totalInteractions = items.reduce((s, it) => s + it.metrics.reactions + it.metrics.comments, 0);

    return {
      openRate30d,
      ackRate30d,
      reactionsPerBase,
      totalInteractions,
      items,
    };
  }
}
