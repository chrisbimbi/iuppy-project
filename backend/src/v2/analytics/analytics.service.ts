import { Injectable, BadRequestException } from '@nestjs/common';
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
  excludeDeleted?: boolean
  sortBy?: 'createdAt' | 'open' | 'unique' | 'ack' | 'reactions' | 'comments' | 'shares' | 'title'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
type ReactionKind = 'like' | 'love' | 'clap' | 'smile' | 'neutral' | 'angry';

function toDateISO(d?: string): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

function q(ident: string) {
  return `"${String(ident).replace(/"/g, '""')}"`;
}
const qq = q;

type SpaceIdsElem = 'uuid' | 'text' | 'varchar' | 'unknown';

@Injectable()
export class AnalyticsV2Service {
  private cachedSpaceElem: SpaceIdsElem | null = null;

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

  // --- Helpers para padronizar tipos de eventos (corrige bancos com VIEW/OPENED/CONFIRM etc.)
  private eventIsOpen(col: string, alias?: string) {
    const id = alias ? `${alias}.${qq(col)}` : qq(col);
    return `(UPPER(${id}::text) IN ('OPEN','OPENED','VIEW','VISIT','VIEWED'))`;
  }
  private eventIsAck(col: string, alias?: string) {
    const id = alias ? `${alias}.${qq(col)}` : qq(col);
    return `(UPPER(${id}::text) IN ('ACK','ACKNOWLEDGE','ACKNOWLEDGED','ACKED','CONFIRM','CONFIRMED'))`;
  }

  // Detecta o tipo do elemento de channel.space_ids (_uuid, _text, _varchar)
  private async getSpaceIdsElementType(): Promise<SpaceIdsElem> {
    if (this.cachedSpaceElem) return this.cachedSpaceElem;
    try {
      const r = await this.ds.query(
        `SELECT data_type, udt_name
           FROM information_schema.columns
          WHERE table_schema='public'
            AND table_name='channel'
            AND column_name='space_ids'
          LIMIT 1`
      );
      const row = r?.[0];
      if (!row) return (this.cachedSpaceElem = 'unknown');

      const udt: string = row.udt_name || '';
      if (udt === '_uuid') return (this.cachedSpaceElem = 'uuid');
      if (udt === '_text') return (this.cachedSpaceElem = 'text');
      if (udt === '_varchar' || udt === '_cstring') return (this.cachedSpaceElem = 'varchar');
      return (this.cachedSpaceElem = 'unknown');
    } catch {
      return (this.cachedSpaceElem = 'unknown');
    }
  }

  private async spaceFilter(alias: string, paramIndex: number): Promise<string> {
    const rows = await this.ds.query(`
      SELECT udt_name
        FROM information_schema.columns
       WHERE table_schema='public' AND table_name='channel' AND column_name='space_ids'
       LIMIT 1
    `);
    const udt = String(rows?.[0]?.udt_name ?? '').toLowerCase();
    if (udt === '_uuid' || udt.includes('uuid')) {
      return `EXISTS (SELECT 1 FROM unnest(${alias}."space_ids") AS sid WHERE sid = $${paramIndex}::uuid)`;
    }
    return `EXISTS (SELECT 1 FROM unnest(${alias}."space_ids") AS sid WHERE sid::text = $${paramIndex}::text)`;
  }

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

  private async softDeleteFilters(table: string, alias: string) {
    const filters: string[] = [];
    try {
      if (await this.schema.hasColumn(table, 'deletedAt')) {
        filters.push(`${alias}."deletedAt" IS NULL`);
      }
    } catch { }
    try {
      if (await this.schema.hasColumn(table, 'deleted')) {
        filters.push(`COALESCE(${alias}."deleted", false) = false`);
      }
    } catch { }
    try {
      if (await this.schema.hasColumn(table, 'status')) {
        filters.push(`UPPER(${alias}."status"::text) <> 'DELETED'`);
      }
    } catch { }
    return filters;
  }

  /** Garante que um `channelId` pertence ao `spaceId` informado */
  private async assertChannelInSpace(spaceId: string, channelId: string): Promise<void> {
    const sql = `SELECT 1
                   FROM channel c
                  WHERE c.id::text = $1::text
                    AND ${await this.spaceFilter('c', 2)}
                  LIMIT 1`;
    const rows = await this.ds.query(sql, [channelId, spaceId]);
    if (!rows?.length) {
      throw new BadRequestException('Canal não pertence ao espaço informado');
    }
  }

  // =========================
  //     /v2/news/:id/metrics
  // =========================
  async newsMetrics(companyId: string, newsId: string, from?: string, to?: string) {
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

    let recebeuPush = 0;
    try {
      recebeuPush = await this.pushRepo.count({ where: { companyId, newsId } });
    } catch {
      recebeuPush = 0;
    }

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
             AND ${this.eventIsOpen(typeCol)}` + between.sql;
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
             AND ${this.eventIsOpen(typeCol)}` + between.sql;
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
             AND ${this.eventIsAck(typeCol)}` + between.sql;
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

    let heatmap: Array<{ hour: number; dow: number; count: number }> = [];
    const metaEv = await this.detectEventMeta();
    if (metaEv) {
      const { table, typeCol, createdAtCol, newsRef } = metaEv;

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
             AND ${this.eventIsOpen(typeCol)}` + between.sql + ` GROUP BY 1,2 ORDER BY 2,1`;
      } else {
        hsql =
          `SELECT EXTRACT(HOUR FROM ${q(createdAtCol)})::int AS hour,
                  EXTRACT(DOW  FROM ${q(createdAtCol)})::int AS dow,
                  COUNT(*)::int AS count
           FROM ${table}
           WHERE "companyId"=$1 AND ${q(newsRef)}=$2
             AND ${this.eventIsOpen(typeCol)}` + between.sql + ` GROUP BY 1,2 ORDER BY 2,1`;
      }
      heatmap = await this.newsRepo.query(hsql, baseParams.concat(between.params));
    }

    let latency: any = {
      sentToDelivered: { avgMs: null, p50Ms: null, p95Ms: null },
      sentToOpen: { avgMs: null, p50Ms: null, p95Ms: null },
    };
    try {
      const qlat =
        `WITH first_open AS (
           SELECT e."companyId", e."newsId", e."userId", MIN(e."createdAt") AS openedAt
             FROM news_interaction_event e
            WHERE e."companyId"=$1 AND e."newsId"=$2 AND ${this.eventIsOpen('type','e')}
            GROUP BY 1,2,3
         ),
         base AS (
           SELECT d."createdAt" AS sentAt,
                  COALESCE(d."deliveredAt", d."createdAt") AS deliveredAt,
                  fo.openedAt AS openedAt
             FROM push_delivery d
        LEFT JOIN first_open fo
               ON fo."companyId"=d."companyId" AND fo."newsId"::text = d."newsId"::text AND fo."userId"=d."userId"
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
      `SELECT a."newsId", COUNT(DISTINCT ud."userId")::int AS c
         FROM news_audience a
         JOIN user_device ud
           ON ud."companyId"=a."companyId"
          AND ud."userId"=a."userId"
          AND ud."enabled"=true
        WHERE a."companyId"=$1 AND a."newsId"::text = ANY($2::text[])
        GROUP BY a."newsId"`,
      [companyId, newsIds],
    );

    let pushRows: any[] = [];
    try {
      pushRows = await this.pushRepo.query(
        `SELECT "newsId", COUNT(*)::int AS c
           FROM push_delivery
          WHERE "companyId" = $1 AND "newsId"::text = ANY($2::text[])
          GROUP BY "newsId"`,
        [companyId, newsIds],
      );
    } catch { /* ignore */ }

    const reactsRows = await this.reactionRepo.query(
      `SELECT "newsId", reaction, COUNT(*)::int AS c
         FROM news_reaction
        WHERE "companyId"=$1 AND "newsId"::text = ANY($2::text[])
        GROUP BY "newsId", reaction`,
      [companyId, newsIds],
    );

    const commentsRows = await this.commentRepo.query(
      `SELECT "newsId", COUNT(*)::int AS c
         FROM news_comment
        WHERE "companyId"=$1 AND "newsId"::text = ANY($2::text[])
        GROUP BY "newsId"`,
      [companyId, newsIds],
    );

    const sharesRows = await this.shareRepo.query(
      `SELECT "newsId", COUNT(*)::int AS c
         FROM news_share
        WHERE "companyId"=$1 AND "newsId"::text = ANY($2::text[])
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
            WHERE "companyId"=$1 AND ${q(newsRef)}::text = ANY($2::text[])
              AND ${this.eventIsOpen(typeCol)}` + betweenOpen.sql +
          ` GROUP BY ${q(newsRef)}`;
        opensRows = await this.newsRepo.query(sql, [companyId, newsIds].concat(betweenOpen.params));
      }
      {
        const sql =
          `SELECT ${q(newsRef)} AS "newsId", COUNT(DISTINCT ${q(userIdCol)})::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND ${q(newsRef)}::text = ANY($2::text[])
              AND ${this.eventIsOpen(typeCol)}` + betweenOpen.sql +
          ` GROUP BY ${q(newsRef)}`;
        uniqueRows = await this.newsRepo.query(sql, [companyId, newsIds].concat(betweenOpen.params));
      }
      {
        const sql =
          `SELECT ${q(newsRef)} AS "newsId", COUNT(DISTINCT ${q(userIdCol)})::int AS c
             FROM ${table}
            WHERE "companyId"=$1 AND ${q(newsRef)}::text = ANY($2::text[])
              AND ${this.eventIsAck(typeCol)}` + betweenAck.sql +
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

    const registradosApp = totalColaboradores;

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
  //   /analytics/news/overview
  // =========================
  async newsOverview(
    companyId: string,
    {
      from, to, spaceId, channelId, groupId,
      excludeDeleted = true,
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      pageSize = 100,
    }: NewsOverviewParams,
  ) {
    // Validar canal ↔ espaço somente se ambos forem informados
    if (spaceId && channelId) {
      await this.assertChannelInSpace(spaceId, channelId);
    }

    const hasNewsSpaceId = await this.schema.hasColumn('news_entity', 'spaceId');
    const hasStatusCol = await this.schema.hasColumn('news_entity', 'status');
    const hasIsPublishedCol = await this.schema.hasColumn('news_entity', 'isPublished');
    const hasPublishedAtCol = await this.schema.hasColumn('news_entity', 'publishedAt');
    const hasSettingsCol = await this.schema.hasColumn('news_entity', 'settings');
    const hasPushTable = await this.schema.hasTable('push_delivery');

    // ===== seleção base de notícias com pushSent =====
    let select = `SELECT n.id, n.title, n."channelId", n."createdAt"`;
    if (hasPublishedAtCol) select += `, n."publishedAt"`;
    if (hasIsPublishedCol) select += `, n."isPublished"`;
    if (hasStatusCol) select += `, n."status"`;

    if (hasPushTable) {
      select += `, EXISTS (SELECT 1 FROM push_delivery d WHERE d."companyId"=$1 AND d."newsId"::text = n.id::text) AS "pushSent"`;
    } else if (hasSettingsCol) {
      select += `, COALESCE((n.settings->>'pushNotification')::boolean, NULL) AS "pushSent"`;
    }

    let fromClause = `FROM news_entity n`;
    const where: string[] = [`n."companyId" = $1`];

    if (excludeDeleted) {
      const delFilters = await this.softDeleteFilters('news_entity', 'n');
      where.push(...delFilters);
    }

    const params: any[] = [companyId];
    let i = params.length + 1;

    if (from) { where.push(`n."createdAt" >= $${i++}`); params.push(from); }
    if (to) { where.push(`n."createdAt" < ($${i++}::date + INTERVAL '1 day')`); params.push(to); }

    if (spaceId) {
      if (hasNewsSpaceId) {
        select += `, n."spaceId"`;
        where.push(`n."spaceId" = $${i++}`);
        params.push(spaceId);
      } else {
        fromClause += ` JOIN channel c ON c.id::text = n."channelId"::text`;
        const selIdx = i++;
        select += `, CAST($${selIdx} AS text) AS "spaceId"`;
        params.push(spaceId);
        const whereIdx = i++;
        where.push(await this.spaceFilter('c', whereIdx));
        params.push(spaceId);
      }
    }

    if (channelId) {
      where.push(`n."channelId"::text = $${i++}::text`);
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
      publishedAt?: string | null
      isPublished?: boolean | null
      status?: string | null
      spaceId?: string | null
      pushSent?: boolean | null
    }> = await this.ds.query(newsSql, params);

    if (newsRows.length === 0) {
      return {
        openRate30d: 0,
        ackRate30d: 0,
        reactionsPerBase: 0,
        totalInteractions: 0,
        items: [],
        total: 0,
        page,
        pageSize,
        seriesDaily: [],
      };
    }

    const ids = newsRows.map(r => r.id);
    const ph = ids.map((_, idx) => `$${idx + 1}`).join(',');
    const baseParams = [...ids];

    // ===== eventos/diária =====
    let opensById = new Map<string, number>();
    let uniqueOpensById = new Map<string, number>();
    let acksUsersById = new Map<string, number>();

    const hasDailyAgg = await this.schema.hasTable('news_metrics_daily');
    if (hasDailyAgg) {
      const ph2 = ids.map((_, idx) => `$${idx + 2}`).join(',');
      const p: any[] = [companyId, ...ids];
      let sql = `
        SELECT d."newsId" AS nid,
               SUM(COALESCE(d.opens,0))::int AS opens,
               SUM(COALESCE(d."uniqueOpens",0))::int AS uniques,
               SUM(COALESCE(d.acks,0))::int AS acks
          FROM news_metrics_daily d
          JOIN news_entity n ON n.id::text = d."newsId"::text AND n."companyId"=$1
         WHERE d."newsId" IN (${ph2})`;
      if (from) { sql += ` AND d."date" >= $${p.length + 1}`; p.push(from); }
      if (to) { sql += ` AND d."date" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(to); }
      if (channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(channelId); }
      if (spaceId) {
        if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(spaceId); }
        else {
          sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
          p.push(spaceId);
        }
      }
      if (excludeDeleted) {
        const del = await this.softDeleteFilters('news_entity', 'n');
        if (del.length) sql += ` AND ${del.join(' AND ')}`;
      }
      sql += ` GROUP BY d."newsId"`;
      const rows: Array<{ nid: string; opens: number; uniques: number; acks: number }> = await this.ds.query(sql, p);
      const byId = new Map(rows.map(r => [r.nid, r]));
      opensById = new Map(ids.map(id => [id, byId.get(id)?.opens ?? 0]));
      uniqueOpensById = new Map(ids.map(id => [id, byId.get(id)?.uniques ?? 0]));
      acksUsersById = new Map(ids.map(id => [id, byId.get(id)?.acks ?? 0]));
    } else {
      const evMap = await this.schema.detectEventMap?.();
      if (evMap) {
        const betweenOpen = this.buildBetweenClause(qq(evMap.createdAtCol), baseParams.length + 2, from, to);
        const betweenAck = this.buildBetweenClause(qq(evMap.createdAtCol), baseParams.length + 2, from, to);

        {
          const evSql =
            `SELECT ${qq(evMap.newsIdCol)} AS nid,
                    COUNT(*)::int AS total
               FROM ${evMap.table}
              WHERE ${qq(evMap.newsIdCol)} IN (${ph})
                AND "companyId" = $${baseParams.length + 1}
                AND ${this.eventIsOpen(evMap.typeCol)}` + betweenOpen.sql +
            ` GROUP BY 1`;
          const evParams = [...baseParams, companyId, ...betweenOpen.params];
          const rows = await this.ds.query(evSql, evParams);
          opensById = new Map(rows.map((r: any) => [r.nid, Number(r.total || 0)]));
        }

        {
          const evSql =
            `SELECT ${qq(evMap.newsIdCol)} AS nid,
                    COUNT(DISTINCT ${qq(evMap.userIdCol)})::int AS uniques
               FROM ${evMap.table}
              WHERE ${qq(evMap.newsIdCol)} IN (${ph})
                AND "companyId" = $${baseParams.length + 1}
                AND ${this.eventIsOpen(evMap.typeCol)}` + betweenOpen.sql +
            ` GROUP BY 1`;
          const evParams = [...baseParams, companyId, ...betweenOpen.params];
          const rows = await this.ds.query(evSql, evParams);
          uniqueOpensById = new Map(rows.map((r: any) => [r.nid, Number(r.uniques || 0)]));
        }

        {
          const evSql =
            `SELECT ${qq(evMap.newsIdCol)} AS nid,
                    COUNT(DISTINCT ${qq(evMap.userIdCol)})::int AS uniques
               FROM ${evMap.table}
              WHERE ${qq(evMap.newsIdCol)} IN (${ph})
                AND "companyId" = $${baseParams.length + 1}
                AND ${this.eventIsAck(evMap.typeCol)}` + betweenAck.sql +
            ` GROUP BY 1`;
          const evParams = [...baseParams, companyId, ...betweenAck.params];
          const rows = await this.ds.query(evSql, evParams);
          acksUsersById = new Map(rows.map((r: any) => [r.nid, Number(r.uniques || 0)]));
        }
      } else {
        const meta = await this.detectEventMeta();
        if (meta) {
          const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;
          const betweenOpen = this.buildBetweenClause(q(createdAtCol), baseParams.length + 2, from, to);
          const betweenAck = this.buildBetweenClause(q(createdAtCol), baseParams.length + 2, from, to);

          {
            const sql =
              `SELECT ${q(newsRef)} AS nid, COUNT(*)::int AS total
                 FROM ${table}
                WHERE ${q(newsRef)} IN (${ph})
                  AND "companyId" = $${baseParams.length + 1}
                  AND ${this.eventIsOpen(typeCol)}` + betweenOpen.sql +
              ` GROUP BY 1`;
            const params = [...baseParams, companyId, ...betweenOpen.params];
            const rows = await this.ds.query(sql, params);
            opensById = new Map(rows.map((r: any) => [r.nid, Number(r.total || 0)]));
          }
          {
            const sql =
              `SELECT ${q(newsRef)} AS nid, COUNT(DISTINCT ${q(userIdCol)})::int AS uniques
                 FROM ${table}
                WHERE ${q(newsRef)} IN (${ph})
                  AND "companyId" = $${baseParams.length + 1}
                  AND ${this.eventIsOpen(typeCol)}` + betweenOpen.sql +
              ` GROUP BY 1`;
            const params = [...baseParams, companyId, ...betweenOpen.params];
            const rows = await this.ds.query(sql, params);
            uniqueOpensById = new Map(rows.map((r: any) => [r.nid, Number(r.uniques || 0)]));
          }
          {
            const sql =
              `SELECT ${q(newsRef)} AS nid, COUNT(DISTINCT ${q(userIdCol)})::int AS uniques
                 FROM ${table}
                WHERE ${q(newsRef)} IN (${ph})
                  AND "companyId" = $${baseParams.length + 1}
                  AND ${this.eventIsAck(typeCol)}` + betweenAck.sql +
              ` GROUP BY 1`;
            const params = [...baseParams, companyId, ...betweenAck.params];
            const rows = await this.ds.query(sql, params);
            acksUsersById = new Map(rows.map((r: any) => [r.nid, Number(r.uniques || 0)]));
          }
        } else {
          const daily = await this.nDailyRepo.find({ where: { newsId: In(ids) } });
          const byId = new Map<string, { opens: number; unique: number; acks: number }>();
          for (const r of daily) {
            const k = (r as any).newsId as string;
            const prev = byId.get(k) || { opens: 0, unique: 0, acks: 0 };
            prev.opens += (r as any).opens || 0;
            prev.unique += (r as any).uniqueOpens || 0;
            prev.acks += (r as any).acks || 0;
            byId.set(k, prev);
          }
          opensById = new Map(Array.from(byId.entries()).map(([nid, v]) => [nid, v.opens]));
          uniqueOpensById = new Map(Array.from(byId.entries()).map(([nid, v]) => [nid, v.unique]));
          acksUsersById = new Map(Array.from(byId.entries()).map(([nid, v]) => [nid, v.acks]));
        }
      }
    }

    // ===== reactions/comments/shares =====
    const reactDel = await this.softDeleteFilters('news_reaction', 'r');
    const commDel = await this.softDeleteFilters('news_comment', 'c');
    const shareDel = await this.softDeleteFilters('news_share', 's');

    let reactsById = new Map<string, number>();
    if (await this.schema.hasTable('news_reaction')) {
      const rSql = `
        SELECT r."newsId" AS nid, COUNT(1)::int AS cnt
          FROM news_reaction r
         WHERE r."newsId" IN (${ph})
           AND r."companyId" = $${baseParams.length + 1}
           ${excludeDeleted && reactDel.length ? ` AND ${reactDel.join(' AND ')}` : ''}
           ${from ? `AND r."createdAt" >= $${baseParams.length + 2}` : ''}
           ${to ? `AND r."createdAt" < ($${baseParams.length + (from ? 3 : 2)}::date + INTERVAL '1 day')` : ''}
         GROUP BY r."newsId"
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
      const cm = await this.schema.detectCommentMap?.();
      const hasApproved = cm ? await this.schema.hasColumn(cm.table, 'approved') : false;
      const createdAtCol = cm?.createdAtCol ?? 'createdAt';
      const table = cm?.table ?? 'news_comment';

      const cSql = `
        SELECT c."newsId" AS nid, COUNT(1)::int AS cnt
          FROM ${table} c
         WHERE c."newsId" IN (${ph})
           AND c."companyId" = $${baseParams.length + 1}
           ${excludeDeleted && commDel.length ? ` AND ${commDel.join(' AND ')}` : ''}
           ${hasApproved ? ` AND COALESCE(c.approved, true) = true` : ''} 
           ${from ? `AND ${qq(createdAtCol)} >= $${baseParams.length + 2}` : ''}
           ${to ? `AND ${qq(createdAtCol)} < ($${baseParams.length + (from ? 3 : 2)}::date + INTERVAL '1 day')` : ''}
         GROUP BY c."newsId"
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

    let sharesById = new Map<string, number>();
    if (await this.schema.hasTable('news_share')) {
      const sSql = `
        SELECT s."newsId" AS nid, COUNT(1)::int AS cnt
          FROM news_share s
         WHERE s."newsId" IN (${ph})
           AND s."companyId" = $${baseParams.length + 1}
           ${excludeDeleted && shareDel.length ? ` AND ${shareDel.join(' AND ')}` : ''}
           ${from ? `AND s."createdAt" >= $${baseParams.length + 2}` : ''}
           ${to ? `AND s."createdAt" < ($${baseParams.length + (from ? 3 : 2)}::date + INTERVAL '1 day')` : ''}
         GROUP BY s."newsId"
      `;
      const sParams = [
        ...baseParams,
        companyId,
        ...(from ? [from] : []),
        ...(to ? [to] : []),
      ];
      const sRows: Array<{ nid: string; cnt: number }> = await this.ds.query(sSql, sParams);
      sharesById = new Map(sRows.map(r => [r.nid, r.cnt]));
    }

    // ===== recebível por notícia =====
    let recebivelById = new Map<string, number>();
    try {
      const recSql = `
        SELECT a."newsId" AS nid, COUNT(DISTINCT ud."userId")::int AS c
          FROM news_audience a
          JOIN user_device ud
            ON ud."companyId"=a."companyId"
           AND ud."userId"=a."userId"
           AND ud."enabled"=true
         WHERE a."companyId"=$${baseParams.length + 1}
           AND a."newsId"::text = ANY($${baseParams.length + 2}::text[])
         GROUP BY a."newsId"
      `;
      const recRows: Array<{ nid: string; c: number }> = await this.ds.query(recSql, [companyId, ids]);
      recebivelById = new Map(recRows.map(r => [r.nid, Number(r.c || 0)]));
    } catch {
      const recRows = await this.audienceRepo.query(
        `SELECT "newsId" AS nid, COUNT(*)::int AS c
           FROM news_audience
          WHERE "companyId"=$1 AND "newsId"::text = ANY($2::text[])
          GROUP BY "newsId"`,
        [companyId, ids],
      );
      recebivelById = new Map(recRows.map((r: any) => [r.nid, Number(r.c || 0)]));
    }

    // monta itens
    let items = newsRows.map(n => ({
      id: n.id,
      title: n.title,
      channelId: n.channelId,
      spaceId: n.spaceId ?? spaceId ?? null,
      createdAt: n.createdAt,
      publishedAt: n.publishedAt ?? null,
      isPublished: n.isPublished ?? null,
      status: n.status ?? null,
      pushSent: typeof n.pushSent === 'boolean' ? n.pushSent : null,
      metrics: {
        open: opensById.get(n.id) ?? 0,
        unique: uniqueOpensById.get(n.id) ?? 0,
        ack: acksUsersById.get(n.id) ?? 0,
        reactions: reactsById.get(n.id) ?? 0,
        comments: commentsById.get(n.id) ?? 0,
        shares: sharesById.get(n.id) ?? 0,
        base: recebivelById.get(n.id) ?? 0,
      },
    }));

    // agregados
    let sumBase = 0, sumOpenU = 0, sumAckU = 0, sumReacts = 0, sumComments = 0, sumShares = 0;
    for (const it of items) {
      const b = it.metrics.base || 0;
      if (b > 0) {
        sumBase += b;
        sumOpenU += it.metrics.unique ?? 0;
        sumAckU += it.metrics.ack;
        sumReacts += it.metrics.reactions;
        sumComments += it.metrics.comments;
        sumShares += it.metrics.shares;
      }
    }
    const openRate30d = sumBase > 0 ? (sumOpenU / sumBase) : 0;
    const ackRate30d = sumBase > 0 ? (sumAckU / sumBase) : 0;
    const reactionsPerBase = sumBase > 0 ? (sumReacts / sumBase) : 0;
    const totalInteractions = sumReacts + sumComments + sumShares;

    // ordenação (inclui 'unique' agora)
    const dir = (sortDir ?? 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const cmp = (a: any, b: any) => {
      const pick = (x: any) => {
        switch (sortBy) {
          case 'open': return x.metrics.open;
          case 'unique': return x.metrics.unique ?? 0;
          case 'ack': return x.metrics.ack;
          case 'reactions': return x.metrics.reactions;
          case 'comments': return x.metrics.comments;
          case 'shares': return x.metrics.shares;
          case 'title': return (x.title ?? '').toLowerCase();
          case 'createdAt':
          default: return x.createdAt ?? '';
        }
      };
      const va = pick(a), vb = pick(b);
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * dir;
      }
      return (va === vb ? 0 : (va > vb ? 1 : -1)) * dir;
    };
    items.sort(cmp);

    // paginação
    const total = items.length;
    const start = Math.max(0, (page - 1) * pageSize);
    const end = Math.min(total, start + pageSize);
    const pageItems = items.slice(start, end);

    const seriesDaily = await this.computeOverviewSeriesDaily(companyId, { from, to, spaceId, channelId, excludeDeleted });

    return {
      openRate30d,
      ackRate30d,
      reactionsPerBase,
      totalInteractions,
      items: pageItems,
      total,
      page,
      pageSize,
      seriesDaily,
    };
  }

  private async computeOverviewSeriesDaily(
    companyId: string,
    opts: { from?: string; to?: string; spaceId?: string; channelId?: string; excludeDeleted?: boolean; preferRaw?: boolean }
  ): Promise<Array<{ date: string; posts?: number; opens?: number; uniqueOpens?: number; acks?: number; reactions?: number; comments?: number; shares?: number }>> {

    const f = toDateISO(opts.from);
    const t = toDateISO(opts.to);
    const fromDate = f ? new Date(f) : undefined;
    const toDate = t ? new Date(t) : undefined;
    const preferRaw = opts.preferRaw ?? true;

    const hasDaily = await this.schema.hasTable('news_metrics_daily');
    const hasNewsSpaceId = await this.schema.hasColumn('news_entity', 'spaceId');
    const delNews = await this.softDeleteFilters('news_entity', 'n');

    const fillDays = (inMap: Map<string, any>) => {
      if (!fromDate || !toDate) {
        return Array.from(inMap.entries())
          .sort((a, b) => a[0] < b[0] ? -1 : 1)
          .map(([d, v]) => ({ date: d, ...v }));
      }
      const out = new Map(inMap) as Map<string, any>;
      for (let d = new Date(fromDate); d < toDate; d.setDate(d.getDate() + 1)) {
        const k = d.toISOString().slice(0, 10);
        if (!out.has(k)) out.set(k, {});
      }
      return Array.from(out.entries())
        .sort((a, b) => a[0] < b[0] ? -1 : 1)
        .map(([d, v]) => ({
          date: d,
          posts: v.posts ?? 0,
          opens: v.opens ?? 0,
          uniqueOpens: v.uniqueOpens ?? 0,
          acks: v.acks ?? 0,
          reactions: v.reactions ?? 0,
          comments: v.comments ?? 0,
          shares: v.shares ?? 0,
        }));
    };

    if (hasDaily && !preferRaw) {
      const p: any[] = [companyId];
      let sql = `
        SELECT to_char(d."date",'YYYY-MM-DD') AS date,
               SUM(COALESCE(d.opens,0))::int AS opens,
               SUM(COALESCE(d."uniqueOpens",0))::int AS "uniqueOpens",
               SUM(COALESCE(d.reactions,0))::int AS reactions,
               SUM(COALESCE(d.comments,0))::int AS comments,
               SUM(COALESCE(d.shares,0))::int AS shares
          FROM news_metrics_daily d
          JOIN news_entity n ON n.id::text = d."newsId"::text AND n."companyId"=$1
         WHERE 1=1`;
      if (f) { sql += ` AND d."date" >= $${p.length + 1}`; p.push(f); }
      if (t) { sql += ` AND d."date" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
      if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
      if (opts.spaceId) {
        if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
        else {
          sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
          p.push(opts.spaceId);
        }
      }
      if (opts.excludeDeleted && delNews.length) {
        sql += ` AND ${delNews.join(' AND ')}`;
      }
      sql += ` GROUP BY 1 ORDER BY 1`;

      const agg = await this.ds.query(sql, p);
      const map = new Map<string, any>();
      for (const r of agg) {
        map.set(r.date, {
          opens: Number(r.opens || 0),
          uniqueOpens: Number(r.uniqueOpens || 0),
          reactions: Number(r.reactions || 0),
          comments: Number(r.comments || 0),
          shares: Number(r.shares || 0),
        });
      }

      const p2: any[] = [companyId];
      let sql2 = `
        SELECT to_char(date_trunc('day', n."createdAt"), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS posts
          FROM news_entity n
         WHERE n."companyId"=$1`;
      if (f) { sql2 += ` AND n."createdAt" >= $${p2.length + 1}`; p2.push(f); }
      if (t) { sql2 += ` AND n."createdAt" < ($${p2.length + 1}::date + INTERVAL '1 day')`; p2.push(t); }
      if (opts.channelId) { sql2 += ` AND n."channelId"::text = $${p2.length + 1}::text`; p2.push(opts.channelId); }
      if (opts.spaceId) {
        if (hasNewsSpaceId) { sql2 += ` AND n."spaceId" = $${p2.length + 1}`; p2.push(opts.spaceId); }
        else {
          sql2 += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p2.length + 1)})`;
          p2.push(opts.spaceId);
        }
      }
      if (opts.excludeDeleted && delNews.length) {
        sql2 += ` AND ${delNews.join(' AND ')}`;
      }
      sql2 += ` GROUP BY 1 ORDER BY 1`;
      const posts = await this.ds.query(sql2, p2);
      for (const r of posts) {
        const cur = map.get(r.date) ?? {};
        map.set(r.date, { ...cur, posts: Number(r.posts || 0) });
      }

      // Sobrepõe com eventos do período (garante dia corrente correto e adiciona ACKs)
      const setDay = (d: string, patch: any) => {
        const cur = map.get(d) ?? {};
        map.set(d, { ...cur, ...patch });
      };

      const ev = await this.detectEventMeta();
      if (ev) {
        const delNewsFilter = opts.excludeDeleted && delNews.length ? ` AND ${delNews.join(' AND ')}` : '';
        const between = this.buildBetweenClause(`e.${qq(ev.createdAtCol)}`, 2, f, t);
        const andChannel = opts.channelId ? ` AND n."channelId"::text = $${between.nextIndex}::text` : '';
        const andSpace = opts.spaceId
          ? (hasNewsSpaceId
            ? ` AND n."spaceId" = $${between.nextIndex + (opts.channelId ? 1 : 0)}`
            : ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', between.nextIndex + (opts.channelId ? 1 : 0))})`)
          : '';

        // opens
        {
          const p = [companyId, ...between.params] as any[];
          if (opts.channelId) p.push(opts.channelId);
          if (opts.spaceId) p.push(opts.spaceId);
          const sql =
            `SELECT to_char(date_trunc('day', e.${qq(ev.createdAtCol)}), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
               FROM ${ev.table} e
               JOIN news_entity n ON n.id = e.${qq(ev.newsRef)} AND n."companyId"=$1
              WHERE ${this.eventIsOpen(ev.typeCol,'e')} ${between.sql} ${andChannel} ${andSpace} ${delNewsFilter}
              GROUP BY 1 ORDER BY 1`;
          const rows = await this.ds.query(sql, p);
          for (const r of rows) setDay(r.d, { opens: Number(r.c || 0) });
        }

        // unique opens
        {
          const p = [companyId, ...between.params] as any[];
          if (opts.channelId) p.push(opts.channelId);
          if (opts.spaceId) p.push(opts.spaceId);
          const sql =
            `SELECT to_char(date_trunc('day', e.${qq(ev.createdAtCol)}), 'YYYY-MM-DD') AS d, COUNT(DISTINCT e.${qq(ev.userIdCol)})::int AS c
               FROM ${ev.table} e
               JOIN news_entity n ON n.id = e.${qq(ev.newsRef)} AND n."companyId"=$1
              WHERE ${this.eventIsOpen(ev.typeCol,'e')} ${between.sql} ${andChannel} ${andSpace} ${delNewsFilter}
              GROUP BY 1 ORDER BY 1`;
          const rows = await this.ds.query(sql, p);
          for (const r of rows) setDay(r.d, { uniqueOpens: Number(r.c || 0) });
        }

        // acks (usuários distintos)
        {
          const p = [companyId, ...between.params] as any[];
          if (opts.channelId) p.push(opts.channelId);
          if (opts.spaceId) p.push(opts.spaceId);
          const sql =
            `SELECT to_char(date_trunc('day', e.${qq(ev.createdAtCol)}), 'YYYY-MM-DD') AS d, COUNT(DISTINCT e.${qq(ev.userIdCol)})::int AS c
               FROM ${ev.table} e
               JOIN news_entity n ON n.id = e.${qq(ev.newsRef)} AND n."companyId"=$1
              WHERE ${this.eventIsAck(ev.typeCol,'e')} ${between.sql} ${andChannel} ${andSpace} ${delNewsFilter}
              GROUP BY 1 ORDER BY 1`;
          const rows = await this.ds.query(sql, p);
          for (const r of rows) setDay(r.d, { acks: Number(r.c || 0) });
        }
      }

      // Reações / Comentários / Compartilhamentos por evento (sobrepõe agregados)
      const hasCommentsTable = await this.schema.hasTable('news_comment');
      const hasReactionsTable = await this.schema.hasTable('news_reaction');
      const hasSharesTable = await this.schema.hasTable('news_share');

      if (hasReactionsTable) {
        const delReac = await this.softDeleteFilters('news_reaction', 'r');
        const p: any[] = [companyId];
        let sql = `
          SELECT to_char(date_trunc('day', r."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
            FROM news_reaction r
            JOIN news_entity n ON n.id::text = r."newsId"::text AND n."companyId"=$1
           WHERE 1=1`;
        if (opts.excludeDeleted && delReac.length) sql += ` AND ${delReac.join(' AND ')}`;
        if (f) { sql += ` AND r."createdAt" >= $${p.length + 1}`; p.push(f); }
        if (t) { sql += ` AND r."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
        if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
        if (opts.spaceId) {
          if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
          else {
            sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
            p.push(opts.spaceId);
          }
        }
        sql += ` GROUP BY 1 ORDER BY 1`;
        const rows = await this.ds.query(sql, p);
        for (const r of rows) setDay(r.d, { reactions: Number(r.c || 0) });
      }

      if (hasCommentsTable) {
        const delComm = await this.softDeleteFilters('news_comment', 'c');
        const p: any[] = [companyId];
        let sql = `
          SELECT to_char(date_trunc('day', c."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
            FROM news_comment c
            JOIN news_entity n ON n.id::text = c."newsId"::text AND n."companyId"=$1
           WHERE 1=1`;
        if (opts.excludeDeleted && delComm.length) sql += ` AND ${delComm.join(' AND ')}`;
        const hasApprovedCol2 = await this.schema.hasColumn('news_comment', 'approved');
        if (hasApprovedCol2) sql += ` AND COALESCE(c.approved, true) = true`;
        if (f) { sql += ` AND c."createdAt" >= $${p.length + 1}`; p.push(f); }
        if (t) { sql += ` AND c."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
        if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
        if (opts.spaceId) {
          if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
          else {
            sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
            p.push(opts.spaceId);
          }
        }
        sql += ` GROUP BY 1 ORDER BY 1`;
        const rows = await this.ds.query(sql, p);
        for (const r of rows) setDay(r.d, { comments: Number(r.c || 0) });
      }

      if (hasSharesTable) {
        const delShare = await this.softDeleteFilters('news_share', 's');
        const p: any[] = [companyId];
        let sql = `
          SELECT to_char(date_trunc('day', s."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
            FROM news_share s
            JOIN news_entity n ON n.id = s."newsId" AND n."companyId"=$1
           WHERE 1=1`;
        if (opts.excludeDeleted && delShare.length) sql += ` AND ${delShare.join(' AND ')}`;
        if (f) { sql += ` AND s."createdAt" >= $${p.length + 1}`; p.push(f); }
        if (t) { sql += ` AND s."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
        if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
        if (opts.spaceId) {
          if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
          else {
            sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
            p.push(opts.spaceId);
          }
        }
        sql += ` GROUP BY 1 ORDER BY 1`;
        const rows = await this.ds.query(sql, p);
        for (const r of rows) setDay(r.d, { shares: Number(r.c || 0) });
      }

      return fillDays(map);
    }

    const ev = await this.detectEventMeta();
    const hasCommentsTable = await this.schema.hasTable('news_comment');
    const hasReactionsTable = await this.schema.hasTable('news_reaction');
    const hasSharesTable = await this.schema.hasTable('news_share');
    const hasApprovedCol = hasCommentsTable ? await this.schema.hasColumn('news_comment', 'approved') : false;

    const map = new Map<string, any>();

    const push = (arr: Array<{ d: string; c: number }>, key: string) => {
      for (const r of arr) {
        map.set(r.d, { ...(map.get(r.d) ?? {}), [key]: Number(r.c || 0) });
      }
    };

    {
      const p: any[] = [companyId];
      let sql = `
        SELECT to_char(date_trunc('day', n."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
          FROM news_entity n
         WHERE n."companyId"=$1`;
      if (f) { sql += ` AND n."createdAt" >= $${p.length + 1}`; p.push(f); }
      if (t) { sql += ` AND n."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
      if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
      if (opts.spaceId) {
        if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
        else {
          sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
          p.push(opts.spaceId);
        }
      }
      if (opts.excludeDeleted && delNews.length) sql += ` AND ${delNews.join(' AND ')}`;
      sql += ` GROUP BY 1 ORDER BY 1`;
      const rows = await this.ds.query(sql, p);
      push(rows, 'posts');
    }

    if (ev) {
      const delNewsFilter = opts.excludeDeleted && delNews.length ? ` AND ${delNews.join(' AND ')}` : '';
      const baseJoin = `
        FROM ${ev.table} e
        JOIN news_entity n ON n.id = e.${qq(ev.newsRef)} AND n."companyId"=$1
       WHERE ${this.eventIsOpen(ev.typeCol,'e')}`;

      const between = this.buildBetweenClause(`e.${qq(ev.createdAtCol)}`, 2, f, t);
      const andChannel = opts.channelId ? ` AND n."channelId"::text = $${between.nextIndex}::text` : '';
      const andSpace = opts.spaceId
        ? (await this.schema.hasColumn('news_entity', 'spaceId')
          ? ` AND n."spaceId" = $${between.nextIndex + (opts.channelId ? 1 : 0)}`
          : ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', between.nextIndex + (opts.channelId ? 1 : 0))})`)
        : '';

      {
        const p = [companyId, ...between.params] as any[];
        if (opts.channelId) p.push(opts.channelId);
        if (opts.spaceId) p.push(opts.spaceId);
        const sql =
          `SELECT to_char(date_trunc('day', e.${qq(ev.createdAtCol)}), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
           ${baseJoin} ${between.sql} ${andChannel} ${andSpace} ${delNewsFilter}
           GROUP BY 1 ORDER BY 1`;
        const rows = await this.ds.query(sql, p);
        push(rows, 'opens');
      }
      {
        const p = [companyId, ...between.params] as any[];
        if (opts.channelId) p.push(opts.channelId);
        if (opts.spaceId) p.push(opts.spaceId);
        const sql =
          `SELECT to_char(date_trunc('day', e.${qq(ev.createdAtCol)}), 'YYYY-MM-DD') AS d, COUNT(DISTINCT e.${qq(ev.userIdCol)})::int AS c
           ${baseJoin} ${between.sql} ${andChannel} ${andSpace} ${delNewsFilter}
           GROUP BY 1 ORDER BY 1`;
        const rows = await this.ds.query(sql, p);
        push(rows, 'uniqueOpens');
      }

      // ACKs (usuários distintos por dia)
      const baseJoinAck = `
        FROM ${ev.table} e
        JOIN news_entity n ON n.id = e.${qq(ev.newsRef)} AND n."companyId"=$1
       WHERE ${this.eventIsAck(ev.typeCol,'e')}`;

      {
        const p = [companyId, ...between.params] as any[];
        if (opts.channelId) p.push(opts.channelId);
        if (opts.spaceId) p.push(opts.spaceId);
        const sql =
          `SELECT to_char(date_trunc('day', e.${qq(ev.createdAtCol)}), 'YYYY-MM-DD') AS d, COUNT(DISTINCT e.${qq(ev.userIdCol)})::int AS c
           ${baseJoinAck} ${between.sql} ${andChannel} ${andSpace} ${delNewsFilter}
           GROUP BY 1 ORDER BY 1`;
        const rows = await this.ds.query(sql, p);
        push(rows, 'acks');
      }
    }

    if (hasReactionsTable) {
      const delReac = await this.softDeleteFilters('news_reaction', 'r');
      const p: any[] = [companyId];
      let sql = `
        SELECT to_char(date_trunc('day', r."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
          FROM news_reaction r
          JOIN news_entity n ON n.id::text = r."newsId"::text AND n."companyId"=$1
         WHERE 1=1`;
      if (opts.excludeDeleted && delReac.length) sql += ` AND ${delReac.join(' AND ')}`;
      if (f) { sql += ` AND r."createdAt" >= $${p.length + 1}`; p.push(f); }
      if (t) { sql += ` AND r."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
      if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
      if (opts.spaceId) {
        if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
        else {
          sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
          p.push(opts.spaceId);
        }
      }
      sql += ` GROUP BY 1 ORDER BY 1`;
      const rows = await this.ds.query(sql, p);
      push(rows, 'reactions');
    }

    if (hasCommentsTable) {
      const delComm = await this.softDeleteFilters('news_comment', 'c');
      const p: any[] = [companyId];
      let sql = `
        SELECT to_char(date_trunc('day', c."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
          FROM news_comment c
          JOIN news_entity n ON n.id::text = c."newsId"::text AND n."companyId"=$1
         WHERE 1=1`;
      if (opts.excludeDeleted && delComm.length) sql += ` AND ${delComm.join(' AND ')}`;
      const hasApprovedCol2 = await this.schema.hasColumn('news_comment', 'approved');
      if (hasApprovedCol2) sql += ` AND COALESCE(c.approved, true) = true`;
      if (f) { sql += ` AND c."createdAt" >= $${p.length + 1}`; p.push(f); }
      if (t) { sql += ` AND c."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
      if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
      if (opts.spaceId) {
        if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
        else {
          sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
          p.push(opts.spaceId);
        }
      }
      sql += ` GROUP BY 1 ORDER BY 1`;
      const rows = await this.ds.query(sql, p);
      push(rows, 'comments');
    }

    if (hasSharesTable) {
      const delShare = await this.softDeleteFilters('news_share', 's');
      const p: any[] = [companyId];
      let sql = `
        SELECT to_char(date_trunc('day', s."createdAt"), 'YYYY-MM-DD') AS d, COUNT(*)::int AS c
          FROM news_share s
          JOIN news_entity n ON n.id = s."newsId" AND n."companyId"=$1
         WHERE 1=1`;
      if (opts.excludeDeleted && delShare.length) sql += ` AND ${delShare.join(' AND ')}`;
      if (f) { sql += ` AND s."createdAt" >= $${p.length + 1}`; p.push(f); }
      if (t) { sql += ` AND s."createdAt" < ($${p.length + 1}::date + INTERVAL '1 day')`; p.push(t); }
      if (opts.channelId) { sql += ` AND n."channelId"::text = $${p.length + 1}::text`; p.push(opts.channelId); }
      if (opts.spaceId) {
        if (hasNewsSpaceId) { sql += ` AND n."spaceId" = $${p.length + 1}`; p.push(opts.spaceId); }
        else {
          sql += ` AND EXISTS (SELECT 1 FROM channel c WHERE c.id::text = n."channelId"::text AND ${await this.spaceFilter('c', p.length + 1)})`;
          p.push(opts.spaceId);
        }
      }
      sql += ` GROUP BY 1 ORDER BY 1`;
      const rows = await this.ds.query(sql, p);
      push(rows, 'shares');
    }

    return fillDays(map);
  }

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
}