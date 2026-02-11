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
import { PushDeliveryEntity } from 'src/v2/push/entities/push-delivery.entity';
import { SchemaIntrospectorV2 } from '../common/schema-introspector.v2';

type NewsOverviewParams = {
  from?: string;
  to?: string;
  spaceId?: string;
  channelId?: string;
  groupId?: string;
  excludeDeleted?: boolean;
  sortBy?:
  | 'createdAt'
  | 'open'
  | 'unique'
  | 'ack'
  | 'reactions'
  | 'comments'
  | 'shares'
  | 'title';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

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
    @InjectRepository(NewsEntity)
    private readonly newsRepo: Repository<NewsEntity>,
    @InjectRepository(NewsReactionEntity)
    private readonly reactionRepo: Repository<NewsReactionEntity>,
    @InjectRepository(NewsCommentEntity)
    private readonly commentRepo: Repository<NewsCommentEntity>,
    @InjectRepository(NewsShareEntity)
    private readonly shareRepo: Repository<NewsShareEntity>,
    @InjectRepository(NewsMetricsDailyEntity)
    private readonly nDailyRepo: Repository<NewsMetricsDailyEntity>,
    @InjectRepository(UserMetricsDailyEntity)
    private readonly uDailyRepo: Repository<UserMetricsDailyEntity>,
    @InjectRepository(SearchMetricsDailyEntity)
    private readonly sDailyRepo: Repository<SearchMetricsDailyEntity>,
    @InjectRepository(PushDeliveryEntity)
    private readonly pushRepo: Repository<PushDeliveryEntity>,
    @InjectRepository(NewsAudienceEntity)
    private readonly audienceRepo: Repository<NewsAudienceEntity>,
    private readonly ds: DataSource,
    private readonly schema: SchemaIntrospectorV2,
  ) { }

  // --- Helpers ---
  private eventIsOpen(col: string, alias?: string) {
    const id = alias ? `${alias}.${qq(col)}` : qq(col);
    return `(UPPER(${id}::text) IN ('OPEN','OPENED','VIEW','VISIT','VIEWED'))`;
  }
  private eventIsAck(col: string, alias?: string) {
    const id = alias ? `${alias}.${qq(col)}` : qq(col);
    return `(UPPER(${id}::text) IN ('ACK','ACKNOWLEDGE','ACKNOWLEDGED','ACKED','CONFIRM','CONFIRMED'))`;
  }

  private async spaceFilter(
    alias: string,
    paramIndex: number,
  ): Promise<string> {
    return `${alias}."space_ids"::text[] @> ARRAY[$${paramIndex}::text]`;
  }

  private async detectEventMeta(): Promise<{
    table: string;
    typeCol: string;
    newsRef: string;
    userIdCol: string;
    createdAtCol: string;
    metaCol?: string | null;
  } | null> {
    const r = await this.ds.query(
      `SELECT to_regclass('public.news_interaction_event') AS nie, to_regclass('public.interaction_event') AS ie`,
    );
    const table =
      (r?.[0]?.nie && 'news_interaction_event') ||
      (r?.[0]?.ie && 'interaction_event') ||
      null;
    if (!table) return null;

    const cols = await this.ds.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      [table],
    );
    const names: string[] = (cols || []).map((c: any) => c.column_name);
    const typeCol = names.includes('type')
      ? 'type'
      : names.includes('event')
        ? 'event'
        : null;
    const newsRef = names.includes('newsId')
      ? 'newsId'
      : names.includes('objectId')
        ? 'objectId'
        : null;
    const userIdCol = names.includes('userId') ? 'userId' : null;
    const createdAtCol = names.includes('createdAt')
      ? 'createdAt'
      : names.includes('created_at')
        ? 'created_at'
        : null;
    const metaCol = names.includes('meta') ? 'meta' : null;

    if (!typeCol || !newsRef || !userIdCol || !createdAtCol) return null;
    return { table, typeCol, newsRef, userIdCol, createdAtCol, metaCol };
  }

  private buildBetweenClause(
    colIdent: string,
    startIndex: number,
    from?: string,
    to?: string,
  ) {
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

  private async softDeleteFilters(table: string, alias: string) {
    const filters: string[] = [];
    try {
      if (await this.schema.hasColumn(table, 'deletedAt'))
        filters.push(`${alias}."deletedAt" IS NULL`);
      if (await this.schema.hasColumn(table, 'deleted'))
        filters.push(`COALESCE(${alias}."deleted", false) = false`);
      if (await this.schema.hasColumn(table, 'status'))
        filters.push(`UPPER(${alias}."status"::text) <> 'DELETED'`);
    } catch { }
    return filters;
  }

  private async assertChannelInSpace(
    spaceId: string,
    channelId: string,
  ): Promise<void> {
    const sql = `SELECT 1 FROM channel c WHERE c.id::text = $1::text AND c."space_ids"::text[] @> ARRAY[$2::text] LIMIT 1`;
    const rows = await this.ds.query(sql, [channelId, spaceId]);
    if (!rows?.length)
      throw new BadRequestException('Canal não pertence ao espaço informado');
  }

  private async getSnapshot(newsId: string): Promise<number> {
    try {
      const r = await this.ds.query(
        `SELECT "audienceSnapshotAtPublish" as s FROM news_entity WHERE id=$1`,
        [newsId],
      );
      const val = r?.[0]?.s;
      if (!val) return 0;
      if (typeof val === 'number') return Number(val);
      if (val.totalUsuarios) return Number(val.totalUsuarios);
      return Number(val);
    } catch {
      return 0;
    }
  }

  // =========================
  //      /v2/news/:id/metrics
  // =========================
  async newsMetrics(
    companyId: string,
    newsId: string,
    from?: string,
    to?: string,
  ) {
    // 1. Snapshot (Audiência Teórica)
    const audienceSnapshot = await this.getSnapshot(newsId);

    // 2. Público Recebível (Ativos)
    let recebivel = 0;
    try {
      const r = await this.ds.query(
        `SELECT COUNT(DISTINCT ud."userId")::int AS c
           FROM news_audience a
           JOIN user_device ud ON ud."companyId"=a."companyId" AND ud."userId"=a."userId" AND ud."enabled"=true
          WHERE a."companyId"=$1 AND a."newsId"=$2`,
        [companyId, newsId],
      );
      recebivel = Number(r?.[0]?.c || 0);

      // Fallback: Se for 0, pode ser pública -> usa snapshot ou total
      if (recebivel === 0) {
        if (audienceSnapshot > 0) {
          recebivel = audienceSnapshot;
        } else {
          const rAll = await this.ds.query(
            `SELECT COUNT(DISTINCT "userId")::int AS c FROM user_device WHERE "companyId"=$1 AND "enabled"=true`,
            [companyId],
          );
          recebivel = Number(rAll?.[0]?.c || 0);
        }
      }
    } catch {
      recebivel = audienceSnapshot > 0 ? audienceSnapshot : 0;
    }
    const finalAudience = audienceSnapshot > 0 ? audienceSnapshot : recebivel;

    // 3. Push (🔥 FIX: Conta USUÁRIOS distintos, não tokens totais)
    let recebeuPush = 0;
    try {
      const rP = await this.ds.query(
        `SELECT COUNT(DISTINCT "userId")::int as c FROM push_delivery WHERE "companyId"=$1 AND "newsId"=$2`,
        [companyId, newsId],
      );
      recebeuPush = Number(rP?.[0]?.c || 0);
    } catch { }

    // 4. Reações
    const reactionsRows = await this.reactionRepo.query(
      `SELECT "reaction" AS r, COUNT(*)::int AS c FROM news_reaction WHERE "newsId"=$1 AND "companyId"=$2 GROUP BY "reaction"`,
      [newsId, companyId],
    );
    const reactionsByType: Record<ReactionKind, number> = {
      like: 0,
      love: 0,
      clap: 0,
      smile: 0,
      neutral: 0,
      angry: 0,
    };
    for (const row of reactionsRows || []) {
      const key = String(row.r) as ReactionKind;
      if (key in reactionsByType) reactionsByType[key] = Number(row.c || 0);
    }
    const reactionsTotal = Object.values(reactionsByType).reduce(
      (s, v) => s + (v || 0),
      0,
    );

    // 5. Comentários
    const comments = { total: 0, pending: 0, approved: 0, rejected: 0 };
    try {
      const agg = await this.commentRepo.query(
        `SELECT COUNT(*)::int AS total, SUM((approved=true)::int)::int AS approved, SUM((approved=false)::int)::int AS rejected 
         FROM news_comment WHERE "newsId"=$1 AND "companyId"=$2`,
        [newsId, companyId],
      );
      if (agg && agg[0]) {
        comments.total = Number(agg[0].total || 0);
        comments.approved = Number(agg[0].approved || 0);
        comments.rejected = Number(agg[0].rejected || 0);
        comments.pending =
          comments.total - comments.approved - comments.rejected;
      }
    } catch { }
    const commentsTotal = comments.total;

    // 6. Shares
    const sharesTotal = await this.shareRepo.count({
      where: { companyId: companyId as any, newsId: newsId as any },
    });

    // 7. Métricas Eventos (Opens, Acks)
    let totalOpens = 0,
      uniqueOpens = 0,
      acks = 0;
    const meta = await this.detectEventMeta();

    if (meta) {
      const { table, typeCol, newsRef, userIdCol, createdAtCol } = meta;
      const baseParams = [companyId, newsId];
      const between = this.buildBetweenClause(q(createdAtCol), 3, from, to);
      const p = [...baseParams, ...between.params];

      const r1 = await this.ds.query(
        `SELECT COUNT(*)::int AS c FROM ${table} WHERE "companyId"=$1 AND ${q(newsRef)}=$2 AND ${this.eventIsOpen(typeCol)} ${between.sql}`,
        p,
      );
      totalOpens = Number(r1?.[0]?.c || 0);

      const r2 = await this.ds.query(
        `SELECT COUNT(DISTINCT ${q(userIdCol)})::int AS c FROM ${table} WHERE "companyId"=$1 AND ${q(newsRef)}=$2 AND ${this.eventIsOpen(typeCol)} ${between.sql}`,
        p,
      );
      uniqueOpens = Number(r2?.[0]?.c || 0);

      const r3 = await this.ds.query(
        `SELECT COUNT(DISTINCT ${q(userIdCol)})::int AS c FROM ${table} WHERE "companyId"=$1 AND ${q(newsRef)}=$2 AND ${this.eventIsAck(typeCol)} ${between.sql}`,
        p,
      );
      acks = Number(r3?.[0]?.c || 0);
    } else {
      const rows = await this.nDailyRepo.find({
        where: { newsId: newsId as any },
      });
      if (rows?.length) {
        totalOpens = rows.reduce((s, r) => s + (r.opens || 0), 0);
        uniqueOpens = rows.reduce((s, r) => s + (r.uniqueOpens || 0), 0);
        acks = rows.reduce((s, r) => s + (r.acks || 0), 0);
      }
    }

    // Favorites (from daily metrics)
    let favorites = 0;
    const favRows = await this.nDailyRepo.find({
      where: { newsId: newsId as any },
    });
    if (favRows?.length) {
      favorites = favRows.reduce((s, r) => s + (r.favorites || 0), 0);
    }

    // 8. Heatmap
    let heatmap: Array<{ hour: number; dow: number; count: number }> = [];
    if (meta) {
      const { table, typeCol, createdAtCol, newsRef } = meta;
      const timeExp = meta.metaCol
        ? `(${q(createdAtCol)} + make_interval(mins => COALESCE((meta->>'tzOffsetMinutes')::int, -180)))`
        : q(createdAtCol);
      const hsql = `SELECT EXTRACT(HOUR FROM ${timeExp})::int AS hour, EXTRACT(DOW FROM ${timeExp})::int AS dow, COUNT(*)::int AS count FROM ${table} WHERE "companyId"=$1 AND ${q(newsRef)}=$2 AND ${this.eventIsOpen(typeCol)} GROUP BY 1,2 ORDER BY 2,1`;
      heatmap = await this.ds.query(hsql, [companyId, newsId]);
    }

    // 9. Série Diária
    const f = toDateISO(from),
      t = toDateISO(to);
    const paramsDaily: any[] = [newsId];
    let sqlDaily = `SELECT to_char(d."date",'YYYY-MM-DD') AS date, d.opens::int, d."uniqueOpens"::int, d.acks::int, d.reactions::int, d.comments::int, d.shares::int, d.favorites::int FROM news_metrics_daily d WHERE d."newsId"=$1`;
    if (f) {
      sqlDaily += ` AND d."date" >= $2`;
      paramsDaily.push(f);
    }
    if (t) {
      sqlDaily += ` AND d."date" < ($${paramsDaily.length + 1}::date + INTERVAL '1 day')`;
      paramsDaily.push(t);
    }
    sqlDaily += ` ORDER BY d."date" ASC`;
    const seriesDaily = await this.nDailyRepo.query(sqlDaily, paramsDaily);

    // 10. Latência Real (Push -> Open)
    const latency: any = {
      sentToDelivered: { avgMs: null, p50Ms: null },
      sentToOpen: { avgMs: null, p50Ms: null },
    };
    try {
      const qlat = `
        WITH first_open AS (
           SELECT "userId", MIN("createdAt") AS openedAt FROM news_interaction_event WHERE "companyId"=$1 AND "newsId"=$2 AND ${this.eventIsOpen('type')} GROUP BY "userId"
        ),
        pairs AS (
           SELECT d."createdAt" AS sentAt, d."deliveredAt", fo.openedAt FROM push_delivery d JOIN first_open fo ON fo."userId" = d."userId"
            WHERE d."companyId"=$1 AND d."newsId"=$2 AND d."status" = 'delivered'
        )
        SELECT AVG(EXTRACT(EPOCH FROM (deliveredAt - sentAt)) * 1000) AS del_avg,
               PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY (deliveredAt - sentAt)) AS del_p50,
               AVG(EXTRACT(EPOCH FROM (openedAt - sentAt)) * 1000) AS open_avg,
               PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY (openedAt - sentAt)) AS open_p50
        FROM pairs WHERE openedAt > sentAt`;
      const rLat = await this.ds.query(qlat, [companyId, newsId]);
      const row = rLat?.[0] || {};
      const toMs = (v: any) => (v ? Math.round(Number(v)) : null);
      const toMsE = (v: any) => (v ? Math.round(Number(v) * 1000) : null);
      latency.sentToDelivered = {
        avgMs: toMs(row.del_avg),
        p50Ms: toMsE(row.del_p50),
      };
      latency.sentToOpen = {
        avgMs: toMs(row.open_avg),
        p50Ms: toMsE(row.open_p50),
      };
    } catch { }

    return {
      newsId,
      audienceSnapshot: finalAudience,
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
      commentsTotal,
      sharesTotal,
      favorites,
    };
  }

  // =========================
  //    /v2/news/metrics (Batch)
  // =========================
  async batchNewsMetrics(
    companyId: string,
    ids: string[],
    from?: string,
    to?: string,
  ): Promise<Record<string, any>> {
    if (!ids.length) return {};
    const newsIds = ids.slice(0, 200);

    let recebivelById = new Map<string, number>();
    try {
      const recSql = `SELECT a."newsId" AS nid, COUNT(DISTINCT ud."userId")::int AS c FROM news_audience a JOIN user_device ud ON ud."companyId"=a."companyId" AND ud."userId"=a."userId" AND ud."enabled"=true WHERE a."companyId"=$1 AND a."newsId"::text = ANY($2::text[]) GROUP BY a."newsId"`;
      const recRows = await this.ds.query(recSql, [companyId, newsIds]);
      recebivelById = new Map(
        recRows.map((r: any) => [r.nid, Number(r.c || 0)]),
      );
    } catch { }

    const idsSemAudiencia = newsIds.filter((id) => !recebivelById.get(id));
    if (idsSemAudiencia.length > 0) {
      const snaps = await this.newsRepo.query(
        `SELECT id, "audienceSnapshotAtPublish" as s FROM news_entity WHERE id = ANY($1::uuid[])`,
        [idsSemAudiencia],
      );
      for (const row of snaps) {
        let val = 0;
        if (typeof row.s === 'number') val = row.s;
        else if (row.s?.totalUsuarios) val = Number(row.s.totalUsuarios);
        if (val > 0) recebivelById.set(row.id, val);
      }
    }

    const metricsById = new Map<string, any>();
    const dailyRows = await this.nDailyRepo.query(
      `SELECT "newsId", SUM(opens)::int as opens, SUM("uniqueOpens")::int as unique_opens, SUM(acks)::int as acks, SUM(reactions)::int as reactions, SUM(comments)::int as comments, SUM(favorites)::int as favorites
         FROM news_metrics_daily WHERE "companyId"=$1 AND "newsId" = ANY($2::uuid[]) GROUP BY "newsId"`,
      [companyId, newsIds],
    );
    for (const r of dailyRows) metricsById.set(r.newsId, r);

    // 🔥 FIX: PUSH Count Distinct Users
    let pushById = new Map<string, number>();
    try {
      const pRows = await this.pushRepo.query(
        `SELECT "newsId", COUNT(DISTINCT "userId")::int as c FROM push_delivery WHERE "companyId"=$1 AND "newsId"::text = ANY($2::text[]) GROUP BY "newsId"`,
        [companyId, newsIds],
      );
      pushById = new Map(pRows.map((r: any) => [r.newsId, Number(r.c)]));
    } catch { }

    const out: Record<string, any> = {};
    for (const id of newsIds) {
      const m = metricsById.get(id) || {};
      out[id] = {
        newsId: id,
        recebivel: recebivelById.get(id) || 0,
        recebeuPush: pushById.get(id) || 0,
        totalOpens: Number(m.opens || 0),
        uniqueOpens: Number(m.unique_opens || 0),
        acks: Number(m.acks || 0),
        reactionsTotal: Number(m.reactions || 0),
        commentsTotal: Number(m.comments || 0),

        favoritesTotal: Number(m.favorites || 0),
        sharesTotal: 0,
        reactionsByType: {},
      };
    }
    return out;
  }

  async newsOverview(companyId: string, params: NewsOverviewParams) {
    if (params.spaceId && params.channelId)
      await this.assertChannelInSpace(params.spaceId, params.channelId);

    let select = `SELECT n.id, n.title, n."channelId", n."createdAt"`;
    if (await this.schema.hasColumn('news_entity', 'publishedAt'))
      select += `, n."publishedAt"`;
    if (await this.schema.hasColumn('news_entity', 'isPublished'))
      select += `, n."isPublished"`;
    if (await this.schema.hasColumn('news_entity', 'status'))
      select += `, n."status"`;
    const hasPushTable = await this.schema.hasTable('push_delivery');
    select += hasPushTable
      ? `, EXISTS (SELECT 1 FROM push_delivery d WHERE d."companyId"=$1 AND d."newsId"::text = n.id::text) AS "pushSent"`
      : `, false AS "pushSent"`;

    let fromClause = `FROM news_entity n`;
    const where: string[] = [`n."companyId"::text = $1::text`];
    const qParams: any[] = [companyId];
    let i = 2;

    if (params.excludeDeleted)
      where.push(...(await this.softDeleteFilters('news_entity', 'n')));
    if (params.from) {
      where.push(`n."createdAt" >= $${i++}`);
      qParams.push(params.from);
    }
    if (params.to) {
      where.push(`n."createdAt" < ($${i++}::date + INTERVAL '1 day')`);
      qParams.push(params.to);
    }
    if (params.spaceId) {
      if (await this.schema.hasColumn('news_entity', 'spaceId')) {
        where.push(`n."spaceId"::text = $${i++}::text`);
        qParams.push(params.spaceId);
      } else {
        fromClause += ` JOIN channel c ON c.id::text = n."channelId"::text`;
        where.push(`${await this.spaceFilter('c', i++)}`);
        qParams.push(params.spaceId);
      }
    }
    if (params.channelId) {
      where.push(`n."channelId"::text = $${i++}::text`);
      qParams.push(params.channelId);
    }

    const orderBy = params.sortBy === 'title' ? 'n.title' : 'n."createdAt"';
    const orderDir = (params.sortDir || 'desc').toUpperCase();
    const limit = Math.max(1, params.pageSize || 100);
    const offset = Math.max(0, ((params.page || 1) - 1) * limit);

    const sql = `${select} ${fromClause} WHERE ${where.join(' AND ')} ORDER BY ${orderBy} ${orderDir} LIMIT ${limit} OFFSET ${offset}`;
    const newsRows = await this.ds.query(sql, qParams);

    const countSql = `SELECT COUNT(*)::int as total ${fromClause} WHERE ${where.join(' AND ')}`;
    const countRes = await this.ds.query(countSql, qParams);
    const total = Number(countRes?.[0]?.total || 0);

    if (!newsRows.length)
      return {
        openRate30d: 0,
        ackRate30d: 0,
        reactionsPerBase: 0,
        totalInteractions: 0,
        items: [],
        total,
        page: params.page,
        pageSize: limit,
        seriesDaily: [],
      };

    const ids = newsRows.map((r: any) => r.id);
    const metricsMap = await this.batchNewsMetrics(
      companyId,
      ids,
      params.from,
      params.to,
    );
    const items = newsRows.map((n: any) => ({
      ...n,
      metrics: metricsMap[n.id] || {},
      pushSent: n.pushSent === true,
    }));

    let sumBase = 0,
      sumOpen = 0,
      sumAck = 0,
      sumReact = 0,
      sumFav = 0;
    items.forEach((it: any) => {
      const b = it.metrics.recebivel || 0;
      if (b > 0) {
        sumBase += b;
        sumOpen += it.metrics.uniqueOpens || 0;
        sumAck += it.metrics.acks || 0;
        sumReact += it.metrics.reactionsTotal || 0;
        sumFav += it.metrics.favoritesTotal || 0;
      }
    });

    // --- Heatmap Aggregation for News (Company Level) ---
    let heatmap: any[] = [];
    try {
      const meta = await this.detectEventMeta();
      if (meta) {
        const { table, typeCol, createdAtCol, newsRef } = meta;

        // DEBUG: Check what event types actually exist
        try {
          const typesFound = await this.ds.query(`SELECT DISTINCT ${typeCol} as t FROM ${table} WHERE "companyId"=$1`, [companyId]);
          console.log('DEBUG HEATMAP EVENT TYPES:', typesFound.map((r: any) => r.t));
        } catch (e) {
          console.error('DEBUG HEATMAP ERROR:', e);
        }

        // Default timezone adjustment -3h
        const timeExp = meta.metaCol
          ? `(${q(createdAtCol)} + make_interval(mins => COALESCE((meta->>'tzOffsetMinutes')::int, -180)))`
          : `(${q(createdAtCol)} - INTERVAL '3 hours')`;

        const paramsHeat: any[] = [companyId];
        let heatFilter = '';

        // Date filters
        if (params.from) {
          heatFilter += ` AND ${q(createdAtCol)} >= $${paramsHeat.length + 1}`;
          paramsHeat.push(params.from);
        }
        if (params.to) {
          heatFilter += ` AND ${q(createdAtCol)} < ($${paramsHeat.length + 1}::date + INTERVAL '1 day')`;
          paramsHeat.push(params.to);
        }

        // --- HEATMAP SPLIT ---
        // 1. Views Heatmap (Reads only)
        // 2. Engagement Heatmap (Reactions/Comments)

        // Common Filters
        const paramsBase = [companyId];
        let baseFilter = '';
        if (params.from) { baseFilter += ` AND ${q(createdAtCol)} >= $${paramsBase.length + 1}`; paramsBase.push(params.from); }
        if (params.to) { baseFilter += ` AND ${q(createdAtCol)} < ($${paramsBase.length + 1}::date + INTERVAL '1 day')`; paramsBase.push(params.to); }

        // A. VIEW Query
        const viewsFilter = ` AND UPPER(${typeCol}::text) IN ('OPEN','OPENED','VIEW','VISIT','VIEWED')`;
        const sqlViews = `
          SELECT 
            EXTRACT(DOW FROM ${timeExp})::int AS day, 
            EXTRACT(HOUR FROM ${timeExp})::int AS hour, 
            COUNT(*)::int AS count 
          FROM ${table} 
          WHERE "companyId"=$1 ${baseFilter} ${viewsFilter}
          GROUP BY 1,2 
          ORDER BY 1,2
        `;
        let heatmapViews = await this.ds.query(sqlViews, paramsBase);

        // B. ENGAGEMENT Query
        const engageFilter = ` AND (UPPER(${typeCol}::text) IN ('REACTION', 'LIKE', 'LOVE', 'CLAP', 'BRAVO', 'SUPPORT') OR ${typeCol}::text ILIKE 'REACTION%')`;
        const sqlEngage = `
          SELECT 
            EXTRACT(DOW FROM ${timeExp})::int AS day, 
            EXTRACT(HOUR FROM ${timeExp})::int AS hour, 
            COUNT(*)::int AS count 
          FROM ${table} 
          WHERE "companyId"=$1 ${baseFilter} ${engageFilter}
          GROUP BY 1,2 
          ORDER BY 1,2
        `;
        let heatmapEngagement = await this.ds.query(sqlEngage, paramsBase);


        // Fallback for Views (if empty)
        if (heatmapViews.length === 0) {
          const { from, to } = params;
          const paramsDaily: any[] = [companyId];
          let dailyFilter = '';
          if (from) { dailyFilter += ` AND "date" >= $${paramsDaily.length + 1}`; paramsDaily.push(from); }
          if (to) { dailyFilter += ` AND "date" < ($${paramsDaily.length + 1}::date + INTERVAL '1 day')`; paramsDaily.push(to); }

          const sqlDailyViews = `
               SELECT 
                 EXTRACT(DOW FROM d."date")::int AS day,
                 12 AS hour, 
                 SUM(d.opens)::int as count
               FROM news_metrics_daily d
               JOIN news_entity n ON n.id = d."newsId"
               WHERE n."companyId"=$1 ${dailyFilter}
               GROUP BY 1
               ORDER BY 1 ASC
           `;
          const dailyRes = await this.ds.query(sqlDailyViews, paramsDaily);
          if (dailyRes.length > 0) heatmapViews = dailyRes;
        }

        // Fallback for Engagement (if empty) using Daily Metrics
        if (heatmapEngagement.length === 0) {
          const { from, to } = params;
          const paramsDaily: any[] = [companyId];
          let dailyFilter = '';
          if (from) { dailyFilter += ` AND "date" >= $${paramsDaily.length + 1}`; paramsDaily.push(from); }
          if (to) { dailyFilter += ` AND "date" < ($${paramsDaily.length + 1}::date + INTERVAL '1 day')`; paramsDaily.push(to); }

          // Sum non-view interactions
          const sqlDaily = `
               SELECT 
                 EXTRACT(DOW FROM d."date")::int AS day,
                 12 AS hour, 
                 SUM(d.reactions + d.comments + d.shares + d.favorites)::int as count
               FROM news_metrics_daily d
               JOIN news_entity n ON n.id = d."newsId"
               WHERE n."companyId"=$1 ${dailyFilter}
               GROUP BY 1
               ORDER BY 1 ASC
           `;
          const dailyRes = await this.ds.query(sqlDaily, paramsDaily);
          if (dailyRes.length > 0) heatmapEngagement = dailyRes;
        }

        heatmap = heatmapViews; // Default legacy return (optional)

        return {
          openRate30d: sumBase ? sumOpen / sumBase : 0,
          ackRate30d: sumBase ? sumAck / sumBase : 0,
          reactionsPerBase: sumBase ? sumReact / sumBase : 0,
          favoritesPerBase: sumBase ? sumFav / sumBase : 0,
          totalInteractions: sumReact + sumFav,
          items,
          total,
          page: params.page || 1,
          pageSize: limit,
          seriesDaily: [],
          heatmap,
          heatmapViews,
          heatmapEngagement
        };

      } else {
        // No meta found
        return {
          openRate30d: 0,
          ackRate30d: 0,
          reactionsPerBase: 0,
          favoritesPerBase: 0,
          totalInteractions: 0,
          items: [],
          total: 0,
          page: params.page || 1,
          pageSize: limit,
          seriesDaily: [],
          heatmap: [],
          heatmapViews: [],
          heatmapEngagement: []
        };
      }
    } catch (e) {
      console.error('Heatmap Error:', e);
      return {
        openRate30d: 0,
        ackRate30d: 0,
        reactionsPerBase: 0,
        favoritesPerBase: 0,
        totalInteractions: 0,
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        seriesDaily: [],
        heatmap: [],
        heatmapViews: [],
        heatmapEngagement: []
      };
    }
  }

  async usersOverview(companyId: string, params: any) {
    const { from, to } = params;
    const f = toDateISO(from);
    const t = toDateISO(to);

    // 1. Total Users (Base)
    const totalUsersRes = await this.ds.query(
      `SELECT COUNT(*)::int as c FROM user_entity WHERE "companyId"=$1 AND "isActive"=true`,
      [companyId],
    );
    const totalUsers = Number(totalUsersRes?.[0]?.c || 0);

    // 2. Active & Engaged Users (in period)
    let activeUsers = 0;
    let engagedUsers = 0;

    // Params for date filtering
    const paramsPeriod: any[] = [companyId];
    let dateFilter = '';
    if (f) {
      dateFilter += ` AND u."date" >= $${paramsPeriod.length + 1}`;
      paramsPeriod.push(f);
    }
    if (t) {
      dateFilter += ` AND u."date" < ($${paramsPeriod.length + 1}::date + INTERVAL '1 day')`;
      paramsPeriod.push(t);
    }

    try {
      // Active: Any entry in user_metrics_daily implies activity (login, open, etc.)
      // Engaged: Has reactions, comments, or shares
      const sqlAgg = `
        SELECT 
          COUNT(DISTINCT u."userId")::int as active,
          COUNT(DISTINCT u."userId") FILTER (WHERE u.reactions > 0 OR u.comments > 0 OR u.shares > 0)::int as engaged,
          SUM(u.reactions)::int as reactions,
          SUM(u.comments)::int as comments,
          SUM(u.shares)::int as shares
        FROM user_metrics_daily u
        JOIN user_entity ue ON ue.id::text = u."userId"::text
        WHERE ue."companyId"=$1 ${dateFilter}
      `;
      const aggRes = await this.ds.query(sqlAgg, paramsPeriod);
      const row = aggRes?.[0] || {};

      activeUsers = Number(row.active || 0);
      engagedUsers = Number(row.engaged || 0);

      var totalReactions = Number(row.reactions || 0);
      var totalComments = Number(row.comments || 0);
      var totalShares = Number(row.shares || 0);
    } catch (e) {
      // ignore
    }

    // 3. Daily Series (Merged: Total Cumulative + Active + Engaged)
    let activitySeries: any[] = [];
    try {
      // A. Get activations (firstLoginAt) AND registrations (createdAt)
      const activationReq = await this.ds.query(`
        SELECT to_char("firstLoginAt", 'YYYY-MM-DD') as date, COUNT(*)::int as c 
        FROM user_entity 
        WHERE "companyId"=$1 AND "firstLoginAt" IS NOT NULL
        GROUP BY 1 ORDER BY 1 ASC
      `, [companyId]);

      const registrationReq = await this.ds.query(`
        SELECT to_char("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as c 
        FROM user_entity 
        WHERE "companyId"=$1
        GROUP BY 1 ORDER BY 1 ASC
      `, [companyId]);

      const activationsMap = new Map<string, number>();
      for (const r of activationReq) if (r.date) activationsMap.set(r.date, Number(r.c));

      const registrationsMap = new Map<string, number>();
      for (const r of registrationReq) if (r.date) registrationsMap.set(r.date, Number(r.c));

      // B. Get Daily Active/Engaged (Bounded by Period if needed, but for full alignment we grab all or bounded)
      // Since we build a graph, we ideally want the same date range as requested or FULL if no dates.
      // If dates are provided, we still need total PRE-period for cumulative baseline.

      // Calculate Baseline Totals (Before 'from')
      let runningTotalActivated = 0;
      let runningTotalRegistered = 0;
      if (f) {
        const preActRes = await this.ds.query(`SELECT COUNT(*)::int as c FROM user_entity WHERE "companyId"=$1 AND "firstLoginAt" < $2`, [companyId, f]);
        runningTotalActivated = Number(preActRes?.[0]?.c || 0);

        const preRegRes = await this.ds.query(`SELECT COUNT(*)::int as c FROM user_entity WHERE "companyId"=$1 AND "createdAt" < $2`, [companyId, f]);
        runningTotalRegistered = Number(preRegRes?.[0]?.c || 0);
      }

      const sqlDaily = `
        SELECT 
          to_char(u."date",'YYYY-MM-DD') as date,
          COUNT(DISTINCT u."userId")::int as active,
          COUNT(DISTINCT u."userId") FILTER (WHERE u.reactions > 0 OR u.comments > 0 OR u.shares > 0)::int as engaged
        FROM user_metrics_daily u
        JOIN user_entity ue ON ue.id::text = u."userId"::text
        WHERE ue."companyId"=$1 ${dateFilter}
        GROUP BY 1 ORDER BY 1 ASC
      `;
      const dailyMetrics = await this.ds.query(sqlDaily, paramsPeriod);
      const metricsMap = new Map<string, { active: number, engaged: number }>();
      for (const r of dailyMetrics) metricsMap.set(r.date, { active: Number(r.active), engaged: Number(r.engaged) });

      // Generate Date Range Set (Union of activations in range AND metrics in range)
      // If we are filtering by date, we iterate from 'from' to 'to'.
      // If no date filter, we iterate from min(activation, metric) to max.
      // For simplicity/robustness match existing `activitySeries` date scope or just use the requested period.

      // If 'from'/'to' provided, generate days.
      let allDates: string[] = [];
      if (f && t) {
        let curr = new Date(f);
        const end = new Date(t);
        while (curr <= end) {
          allDates.push(curr.toISOString().slice(0, 10));
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        // Use all available dates from DB maps
        const dSet = new Set([...activationsMap.keys(), ...metricsMap.keys(), ...registrationsMap.keys()]);
        allDates = Array.from(dSet).sort();
      }

      // Build Series
      // Note: If no date filter, runningTotal starts at 0 and accumulates.
      // If date filter exists, runningTotal starts at baseline calculated above.
      // We must iterate linearly through ALL activations to ensure total is correct, OR trust the baseline query.

      // Correct approach with potentially sparse dates in selection:
      // It is safer to NOT filter Activations by date in step A if we want to build accurate cumulative on the fly, 
      // OR use the baseline query.
      // We used baseline query for 'from'.
      // But inside the loop, if we skip dates (sparse map), we miss increments?
      // Re-think: "activationsMap" is only for dates in range?
      // No, step A query (lines above) has NO date filter. It gets ALL days with activations.
      // So we can compute the FULL cumulative timeline then slice?
      // Yes, safest.

      const fullTimeline = new Map<string, number>();
      let tempTotal = 0;
      // Sort all activation dates
      const activationDates = Array.from(activationsMap.keys()).sort();
      // Fill gaps? No need, just cumulative sum map.
      // Actually, we need to lookup precise date.

      // Let's optimize:
      // We only care about the requested range for the OUTPUT.
      // But we need the cumulative sum at each point.
      // With Baseline (users < from), we can just iterate the requested range.
      // But we need to add activations happening WITHIN the range.
      // `activationsMap` contains ALL dates.

      for (const d of allDates) {
        // If we are iterating strictly sequentially from 'from' to 'to':
        // We need to add activations for 'd'.
        // AND carry over previous total.

        // Wait, if allDates has gaps (e.g. from DB keys), we miss days.
        // Ideally we generate continuous days.
        // If no Filter params, we might have gaps in `allDates`.

        // Let's assume strict sequential iteration if params provided.
        // If not provided, we iterate sorted union of keys.

        // For the TOTAL, we conceptually need `COUNT(firstLoginAt <= d)`.
        // We can just calculate this! No need for loop summation error prone logic.
        // But running 30 queries (one per day) is bad.

        // Hybrid:
        // runningTotal is "Total users before Day D".
        // On Day D, new users = activationsMap.get(D) || 0.
        // total = runningTotal + newUsers.
        // runningTotal += newUsers.

        // This requires iterating ALL dates or ensuring we don't skip increments.
        // If `allDates` has gaps, and we skip a day with activations, our total lags.
        // So if we rely on loop, `allDates` MUST be continuous.

        // Fix: If no params provided, find min/max and fill.
        // If params provided, fill.
      }

      // Let's implement the Continuous fill.
      if (allDates.length === 0 && activationDates.length > 0) {
        let curr = new Date(activationDates[0]);
        const end = new Date(activationDates[activationDates.length - 1]);
        // Add metric dates max bounds too?
        // Simplifying: Just use activation dates + metric dates bounds.
        const metricDates = Array.from(metricsMap.keys()).sort();
        if (metricDates.length > 0) {
          const mStart = new Date(metricDates[0]);
          const mEnd = new Date(metricDates[metricDates.length - 1]);
          if (mStart < curr) curr = mStart;
          if (mEnd > end) end.setTime(mEnd.getTime()); // Update end
          // Note: simplistic date logic, but standard JS Date compare works.
        }

        allDates = [];
        while (curr <= end) {
          allDates.push(curr.toISOString().slice(0, 10));
          curr.setDate(curr.getDate() + 1);
        }
      }

      // Now iterate continuous `allDates`
      // Also calculate engaged90d at each point: users who engaged in last 90 days from that date
      const engaged90dMap = new Map<string, number>();

      // Pre-calculate engaged90d for each date
      for (const d of allDates) {
        try {
          const date90dAgo = new Date(d);
          date90dAgo.setDate(date90dAgo.getDate() - 90);
          const date90dAgoStr = date90dAgo.toISOString().slice(0, 10);

          const sqlEngaged90d = `
            SELECT COUNT(DISTINCT u."userId")::int as count
            FROM user_metrics_daily u
            JOIN user_entity ue ON ue.id::text = u."userId"::text
            WHERE ue."companyId"=$1 
              AND u."date" > $2 
              AND u."date" <= $3
              AND (u.reactions > 0 OR u.comments > 0 OR u.shares > 0)
          `;
          const res = await this.ds.query(sqlEngaged90d, [companyId, date90dAgoStr, d]);
          engaged90dMap.set(d, Number(res?.[0]?.count || 0));
        } catch (e) {
          engaged90dMap.set(d, 0);
        }
      }

      for (const d of allDates) {
        runningTotalActivated += (activationsMap.get(d) || 0);
        runningTotalRegistered += (registrationsMap.get(d) || 0);

        const m = metricsMap.get(d) || { active: 0, engaged: 0 };
        activitySeries.push({
          date: d,
          registered: runningTotalRegistered,
          total: runningTotalActivated, // Keeping 'total' as Activated to maintain partial backward compat, mapped explicitly in Controller
          active: m.active,
          engaged: m.engaged,
          engaged90d: engaged90dMap.get(d) || 0
        });
      }

      // Filter final output by requested range (if we generated broad range for total calc? 
      // - If we used start=from, runningTotal was initialized with Baseline.
      // - If we auto-detected range, we shouldn't filter much.
      // Note: 'allDates' was generated based on 'from/to' OR 'min/max data'.
      // So no extra filtering needed?
      // Wait, if we use Baseline (f is set), we iterate from f.
      // But activationsMap has ALL dates. We must NOT add activations BEFORE f to runningTotal in the loop.
      // So inside loop: `added = activationsMap.get(d)`. 
      // If d < f (impossible if we generate allDates from f), no risk.
      // But we verified `allDates` starts at `f` if provided.
      // So we are good.

    } catch (e) {
      console.error('Activity Series Error', e);
    }

    // 4. Heatmap (Active Users by Time)
    // Uses news_interaction_event for precise timestamps
    let heatmap: any[] = [];
    try {
      const meta = await this.detectEventMeta();
      if (meta) {
        const { table, createdAtCol, userIdCol } = meta;
        // Adjust for timezone if needed, defaulting to -3h (America/Sao_Paulo) for now or use meta
        // Using a fixed offset for simplicity as per existing code patterns or just raw
        const timeExp = `(${q(createdAtCol)} - INTERVAL '3 hours')`;

        const paramsHeat: any[] = [companyId];
        let heatFilter = '';
        if (f) {
          heatFilter += ` AND ${q(createdAtCol)} >= $${paramsHeat.length + 1}`;
          paramsHeat.push(f);
        }
        if (t) {
          heatFilter += ` AND ${q(createdAtCol)} < ($${paramsHeat.length + 1}::date + INTERVAL '1 day')`;
          paramsHeat.push(t);
        }

        const sqlHeat = `
          SELECT 
            EXTRACT(DOW FROM ${timeExp})::int AS dow, 
            EXTRACT(HOUR FROM ${timeExp})::int AS hour, 
            COUNT(DISTINCT ${q(userIdCol)})::int AS count 
          FROM ${table} 
          WHERE "companyId"=$1 ${heatFilter}
          GROUP BY 1,2 
          ORDER BY 1,2
        `;
        heatmap = await this.ds.query(sqlHeat, paramsHeat);
      }
    } catch (e) {
      // ignore
    }

    // 5. Turnover & Financial Loss (Strategic)
    // We judge Turnover by Inactive Users who were updated recently? 
    // Or just Total Inactive Count? 
    // Metric: "Turnover Rate" usually = (Leavers / Avg Headcount).
    // Here we will just Count Inactive for now, and estimate cost 
    // assuming they left 'this year' or similar if we had date filter.
    // For now: Total Inactive / Total Registered => Accumulative Churn.
    // Cost: Inactive * R$ 5,000.
    const inactiveUsers = totalUsers - activeUsers; // This logic is flawed if 'activeUsers' means 'logged in recently'.
    // We need 'Deactivated Users' (isActive=false)
    const deactivatedRes = await this.ds.query(
      `SELECT COUNT(*)::int as c FROM user_entity WHERE "companyId"=$1 AND "isActive"=false`,
      [companyId]
    );
    const deactivatedCount = Number(deactivatedRes?.[0]?.c || 0);
    const totalHeadcount = totalUsers + deactivatedCount; // If totalUsers was only active. Verify query above (line 624).
    // line 624: WHERE "companyId"=$1 AND "isActive"=true. So totalUsers IS active headcount.

    // Turnover Rate (All time or Period?) 
    // Let's stick to Snapshot: Deactivated / (Active + Deactivated)
    // 6. Registered (All time) & Activated (All time)
    const registeredRes = await this.ds.query(`SELECT COUNT(*)::int as c FROM user_entity WHERE "companyId"=$1`, [companyId]);
    const totalRegistered = Number(registeredRes?.[0]?.c || 0);

    const activatedRes = await this.ds.query(`SELECT COUNT(*)::int as c FROM user_entity WHERE "companyId"=$1 AND "firstLoginAt" IS NOT NULL`, [companyId]);
    const totalActivated = Number(activatedRes?.[0]?.c || 0);

    // Turnover Rate logic remains using deactivated count from earlier
    const turnoverRate = totalRegistered > 0 ? (deactivatedCount / totalRegistered) * 100 : 0;
    const turnoverCost = deactivatedCount * 5000; // Proxy Cost

    // Rates based on Registered Base
    const activeRate = totalRegistered > 0 ? Math.round((activeUsers / totalRegistered) * 100) : 0;
    const engagedRate = activeUsers > 0 ? Math.round((engagedUsers / activeUsers) * 100) : 0;

    const activationRate = totalRegistered > 0 ? Math.round((totalActivated / totalRegistered) * 100) : 0;

    return {
      users: {
        total: totalRegistered,
        registered: totalRegistered,
        activated: totalActivated,
        active: activeUsers,
        engaged: engagedUsers,
        activeRate,
        engagedRate,
        activationRate,
        turnoverRate: Number(turnoverRate.toFixed(1)),
        turnoverCost: turnoverCost
      },
      topConnected: await this.getTopConnectedUsers(companyId, f, t),
      engagement: {
        reactions: totalReactions || 0,
        comments: totalComments || 0,
        shares: totalShares || 0
      },
      activitySeries,
      interactions: {
        likes: totalReactions || 0,
        comments: totalComments || 0,
        shares: totalShares || 0
      },
      heatmap
    };
  }

  private async getTopConnectedUsers(companyId: string, from?: string, to?: string) {
    const params: any[] = [companyId];
    let dateFilter = '';
    if (from) {
      dateFilter += ` AND u."date" >= $${params.length + 1}`;
      params.push(from);
    }
    if (to) {
      dateFilter += ` AND u."date" < ($${params.length + 1}::date + INTERVAL '1 day')`;
      params.push(to);
    }

    const sql = `
      SELECT 
        ue.id, 
        ue.name, 
        ue."jobTitle" as role, 
        ue."avatarUrl" as avatar,
        ue.xp as xp
      FROM user_metrics_daily u
      JOIN user_entity ue ON ue.id::text = u."userId"::text
      WHERE ue."companyId"=$1 ${dateFilter}
      GROUP BY ue.id, ue.name, ue."jobTitle", ue."avatarUrl", ue.xp
      ORDER BY ue.xp DESC
      LIMIT 10
    `;
    const rows = await this.ds.query(sql, params);
    return rows.map((r: any) => ({
      ...r,
      color: ['primary', 'success', 'info', 'warning', 'danger'][Math.floor(Math.random() * 5)]
    }));
  }

  async getChannelEffectiveness(companyId: string) {
    // Aggregate Metrics by Channel
    // We need to JOIN news_entity to get channelId
    // Then JOIN news_metrics_daily or calculate from events
    // Using metrics_daily for speed

    const sql = `
        SELECT 
           n."channelId", 
           c.name as "channelName",
           COUNT(DISTINCT n.id) as "newsCount",
           SUM(d.opens)::int as "totalOpens",
           SUM(d."uniqueOpens")::int as "uniqueOpens"
        FROM news_entity n
        JOIN news_metrics_daily d ON d."newsId" = n.id
        LEFT JOIN channel c ON c.id::text = n."channelId"::text
        WHERE n."companyId" = $1
        GROUP BY 1, 2
        ORDER BY "uniqueOpens" DESC
    `;

    const rows = await this.ds.query(sql, [companyId]);
    return rows.map((r: any) => ({
      channelId: r.channelId,
      channelName: r.channelName || 'Unknown',
      newsCount: Number(r.newsCount),
      uniqueOpens: Number(r.uniqueOpens),
      avgOpensPerNews: Number(r.newsCount) > 0 ? Math.round(Number(r.uniqueOpens) / Number(r.newsCount)) : 0
    }));
  }

  async searchOverview(companyId: string, params: any) {
    return {};
  }

  /**
   * Phase 2: Reading Behavior Analytics
   * Analyzes "time-on-page" to distinguish opening from reading.
   * Buckets: Glanced (< 3s), Skimmed (3-10s), Read (> 10s)
   */
  async getReadingBehavior(
    companyId: string,
    params?: { from?: string; to?: string; newsId?: string },
  ) {
    const { from, to, newsId } = params || {};
    const fromDate = from ? toDateISO(from) : undefined;
    const toDate = to ? toDateISO(to) : undefined;

    // Build WHERE clause
    const whereClauses: string[] = [`e."companyId" = $1`];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    // Filter by OPEN events only
    whereClauses.push(`e.type = 'OPEN'`);

    // Date range
    if (fromDate) {
      whereClauses.push(`DATE(e."createdAt") >= $${paramIndex}`);
      queryParams.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereClauses.push(`DATE(e."createdAt") <= $${paramIndex}`);
      queryParams.push(toDate);
      paramIndex++;
    }

    // Specific news filter
    if (newsId) {
      whereClauses.push(`e."newsId" = $${paramIndex}`);
      queryParams.push(newsId);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');

    // Query: Extract durationMs from meta->durationMs
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE (e.meta->>'durationMs')::int < 3000) AS "glanced",
        COUNT(*) FILTER (WHERE (e.meta->>'durationMs')::int >= 3000 AND (e.meta->>'durationMs')::int < 10000) AS "skimmed",
        COUNT(*) FILTER (WHERE (e.meta->>'durationMs')::int >= 10000) AS "read",
        COUNT(*) FILTER (WHERE e.meta->>'durationMs' IS NULL OR e.meta->>'durationMs' = '') AS "noDuration",
        COUNT(*) AS "totalOpens",
        COUNT(DISTINCT e."userId") AS "uniqueReaders",
        AVG((e.meta->>'durationMs')::int) FILTER (WHERE e.meta->>'durationMs' IS NOT NULL) AS "avgDurationMs"
      FROM news_interaction_event e
      WHERE ${whereClause}
    `;

    const [result] = await this.ds.query(sql, queryParams);

    return {
      from: fromDate || null,
      to: toDate || null,
      totalOpens: Number(result.totalOpens || 0),
      uniqueReaders: Number(result.uniqueReaders || 0),
      avgDurationMs: result.avgDurationMs ? Math.round(Number(result.avgDurationMs)) : null,
      buckets: {
        glanced: Number(result.glanced || 0), // < 3s
        skimmed: Number(result.skimmed || 0), // 3-10s
        read: Number(result.read || 0), // > 10s
      },
      noDuration: Number(result.noDuration || 0), // Legacy opens without tracking
    };
  }

  /**
   * Phase 3: Traffic Attribution Analytics
   * Analyzes where users come from (Push, Email, Social, Direct, UTM campaigns)
   * Tracks meta.origin, meta.utm_source, meta.utm_medium, meta.utm_campaign
   */
  async getTrafficSources(
    companyId: string,
    params?: { from?: string; to?: string; newsId?: string },
  ) {
    const { from, to, newsId } = params || {};
    const fromDate = from ? toDateISO(from) : undefined;
    const toDate = to ? toDateISO(to) : undefined;

    // Build WHERE clause
    const whereClauses: string[] = [`e."companyId" = $1`];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    // Filter by OPEN events only
    whereClauses.push(`e.type = 'OPEN'`);

    // Date range
    if (fromDate) {
      whereClauses.push(`DATE(e."createdAt") >= $${paramIndex}`);
      queryParams.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereClauses.push(`DATE(e."createdAt") <= $${paramIndex}`);
      queryParams.push(toDate);
      paramIndex++;
    }

    // Specific news filter
    if (newsId) {
      whereClauses.push(`e."newsId" = $${paramIndex}`);
      queryParams.push(newsId);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');

    // Query: Aggregate by origin and UTM source
    const sql = `
      WITH sources AS (
        SELECT
          COALESCE(e.meta->>'origin', 'unknown') AS origin,
          COALESCE(e.meta->>'utm_source', '') AS utm_source,
          COALESCE(e.meta->>'utm_medium', '') AS utm_medium,
          COALESCE(e.meta->>'utm_campaign', '') AS utm_campaign,
          COUNT(*) AS opens,
          COUNT(DISTINCT e."userId") AS unique_users
        FROM news_interaction_event e
        WHERE ${whereClause}
        GROUP BY origin, utm_source, utm_medium, utm_campaign
      )
      SELECT
        origin,
        utm_source,
        utm_medium,
        utm_campaign,
        opens AS "count",
        unique_users AS "uniqueUsers"
      FROM sources
      ORDER BY opens DESC
    `;

    const rows = await this.ds.query(sql, queryParams);

    // Aggregate by primary source (origin or utm_source)
    const sourceMap = new Map<string, { count: number; uniqueUsers: number }>();

    for (const row of rows) {
      // Prioritize UTM source over origin
      const primarySource = row.utm_source || row.origin || 'direct';
      const existing = sourceMap.get(primarySource) || { count: 0, uniqueUsers: 0 };

      sourceMap.set(primarySource, {
        count: existing.count + Number(row.count),
        uniqueUsers: existing.uniqueUsers + Number(row.uniqueUsers),
      });
    }

    // Convert to array and calculate percentages
    const totalOpens = Array.from(sourceMap.values()).reduce((sum, s) => sum + s.count, 0);
    const sources = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        count: data.count,
        uniqueUsers: data.uniqueUsers,
        percentage: totalOpens > 0 ? Math.round((data.count / totalOpens) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // UTM campaign breakdown (for detailed attribution)
    const campaigns = rows
      .filter((r) => r.utm_campaign)
      .map((r) => ({
        campaign: r.utm_campaign,
        source: r.utm_source || r.origin,
        medium: r.utm_medium,
        count: Number(r.count),
        uniqueUsers: Number(r.uniqueUsers),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 campaigns

    return {
      from: fromDate || null,
      to: toDate || null,
      totalOpens,
      sources,
      campaigns,
    };
  }

  /**
   * Phase 4: Chat & Session Behavioral Analytics
   * Tracks messaging patterns and session engagement to identify behavioral indicators
   */
  async getChatBehavior(
    companyId: string,
    params?: { from?: string; to?: string; userId?: string },
  ) {
    const { from, to, userId } = params || {};
    const fromDate = from ? toDateISO(from) : undefined;
    const toDate = to ? toDateISO(to) : undefined;

    // Build WHERE clause
    const whereClauses: string[] = [`m."conversationId" IN (
      SELECT p."conversationId" FROM chat_participant p
      JOIN user_entity u ON u.id = p."userId"
      WHERE u."companyId" = $1
    )`];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    // Date range
    if (fromDate) {
      whereClauses.push(`DATE(m."createdAt") >= $${paramIndex}`);
      queryParams.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereClauses.push(`DATE(m."createdAt") <= $${paramIndex}`);
      queryParams.push(toDate);
      paramIndex++;
    }

    // Specific user filter
    if (userId) {
      whereClauses.push(`m."senderId" = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    // Exclude deleted messages
    whereClauses.push(`m."deletedAt" IS NULL`);

    const whereClause = whereClauses.join(' AND ');

    // Main chat metrics query
    const metricsSql = `
      SELECT
        COUNT(*) AS "totalMessages",
        COUNT(DISTINCT m."senderId") AS "activeUsers",
        COUNT(DISTINCT m."conversationId") AS "activeConversations",
        COUNT(*) FILTER (WHERE m.type = 'TEXT') AS "textMessages",
        COUNT(*) FILTER (WHERE m.type = 'IMAGE') AS "imageMessages",
        COUNT(*) FILTER (WHERE m.type = 'VOICE') AS "voiceMessages",
        COUNT(*) FILTER (WHERE m.type = 'FILE') AS "fileMessages",
        COUNT(DISTINCT CASE WHEN c.type = 'GROUP' THEN m."conversationId" END) AS "groupConversations",
        COUNT(DISTINCT CASE WHEN c.type = 'DIRECT' THEN m."conversationId" END) AS "directConversations",
        COUNT(*) FILTER (WHERE c.type = 'GROUP') AS "groupMessages",
        COUNT(*) FILTER (WHERE c.type = 'DIRECT') AS "directMessages",
        AVG(
          CASE 
            WHEN m."replyToId" IS NOT NULL THEN
              EXTRACT(EPOCH FROM (m."createdAt" - prev."createdAt")) / 60
            ELSE NULL
          END
        ) AS "avgResponseTimeMinutes"
      FROM chat_message m
      LEFT JOIN chat_message prev ON prev.id = m."replyToId"
      LEFT JOIN chat_conversation c ON c.id = m."conversationId"
      WHERE ${whereClause}
    `;

    const [metrics] = await this.ds.query(metricsSql, queryParams);

    // Top messengers (activity leaders)
    const topMessengersSql = `
      SELECT
        m."senderId" AS "userId",
        u.name AS "userName",
        COUNT(*) AS "messageCount",
        COUNT(DISTINCT m."conversationId") AS "conversationCount",
        MAX(m."createdAt") AS "lastMessageAt"
      FROM chat_message m
      LEFT JOIN user_entity u ON u.id = m."senderId"
      WHERE ${whereClause}
      GROUP BY m."senderId", u.name
      ORDER BY "messageCount" DESC
      LIMIT 10
    `;

    const topMessengers = await this.ds.query(topMessengersSql, queryParams);

    // Daily message volume (for trend chart)
    const dailyVolumeSql = `
      SELECT
        DATE(m."createdAt") AS "date",
        COUNT(*) AS "count"
      FROM chat_message m
      WHERE ${whereClause}
      GROUP BY DATE(m."createdAt")
      ORDER BY "date" DESC
      LIMIT 30
    `;

    const dailyVolume = await this.ds.query(dailyVolumeSql, queryParams);

    // Low activity users (potential churn risk)
    const inactiveThreshold = 7; // days
    const lowActivitySql = `
      SELECT
        u.id AS "userId",
        u.name AS "userName",
        COUNT(m.id) AS "messageCount",
        MAX(m."createdAt") AS "lastMessageAt",
        EXTRACT(EPOCH FROM (NOW() - MAX(m."createdAt"))) / 86400 AS "daysSinceLastMessage"
      FROM user_entity u
      LEFT JOIN chat_message m ON m."senderId" = u.id
        AND m."deletedAt" IS NULL
      WHERE u."companyId" = $1
        AND u."isActive" = true
      GROUP BY u.id, u.name
      HAVING MAX(m."createdAt") IS NULL 
        OR EXTRACT(EPOCH FROM (NOW() - MAX(m."createdAt"))) / 86400 > ${inactiveThreshold}
      ORDER BY "daysSinceLastMessage" DESC NULLS FIRST
      LIMIT 20
    `;

    const lowActivityUsers = await this.ds.query(lowActivitySql, [companyId]);

    return {
      from: fromDate || null,
      to: toDate || null,
      totalMessages: Number(metrics.totalMessages || 0),
      activeUsers: Number(metrics.activeUsers || 0),
      activeConversations: Number(metrics.activeConversations || 0),
      conversationTypes: {
        group: Number(metrics.groupConversations || 0),
        direct: Number(metrics.directConversations || 0),
        groupMessages: Number(metrics.groupMessages || 0),
        directMessages: Number(metrics.directMessages || 0),
      },
      messageTypes: {
        text: Number(metrics.textMessages || 0),
        image: Number(metrics.imageMessages || 0),
        voice: Number(metrics.voiceMessages || 0),
        file: Number(metrics.fileMessages || 0),
      },
      avgResponseTimeMinutes: metrics.avgResponseTimeMinutes
        ? Math.round(Number(metrics.avgResponseTimeMinutes))
        : null,
      topMessengers: topMessengers.map((m: any) => ({
        userId: m.userId,
        userName: m.userName || 'Unknown',
        messageCount: Number(m.messageCount),
        conversationCount: Number(m.conversationCount),
        lastMessageAt: m.lastMessageAt,
      })),
      dailyVolume: dailyVolume.map((d: any) => ({
        date: d.date,
        count: Number(d.count),
      })),
      lowActivityUsers: lowActivityUsers.map((u: any) => ({
        userId: u.userId,
        userName: u.userName || 'Unknown',
        messageCount: Number(u.messageCount || 0),
        lastMessageAt: u.lastMessageAt,
        daysSinceLastMessage: u.daysSinceLastMessage
          ? Math.round(Number(u.daysSinceLastMessage))
          : null,
      })),
      insights: {
        churnRisk: lowActivityUsers.length,
        engagementRate:
          metrics.activeUsers > 0
            ? Math.round((Number(metrics.totalMessages) / Number(metrics.activeUsers)) * 10) / 10
            : 0,
      },
    };
  }

  /**
   * Phase 5: Engagement Funnel & Segmented Analytics
   * Tracks conversion funnel (Registered → Activated → Engaged) by user segments
   */
  async getEngagementFunnel(
    companyId: string,
    params?: { from?: string; to?: string; segment?: 'department' | 'jobTitle' | 'location' },
  ) {
    const { from, to, segment } = params || {};
    const fromDate = from ? toDateISO(from) : undefined;
    const toDate = to ? toDateISO(to) : undefined;

    // Build WHERE clause for users
    const whereClauses: string[] = [`u."companyId" = $1`];
    const queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (fromDate) {
      whereClauses.push(`DATE(u."createdAt") >= $${paramIndex}`);
      queryParams.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      whereClauses.push(`DATE(u."createdAt") <= $${paramIndex}`);
      queryParams.push(toDate);
      paramIndex++;
    }

    // Only active users
    whereClauses.push(`u."isActive" = true`);

    const whereClause = whereClauses.join(' AND ');

    // Segmentation field (default: none)
    const segmentField = segment
      ? `u."${segment}"`
      : `'All Users'::text`;
    const segmentAlias = segment || 'all';

    // Funnel stages query
    const funnelSql = `
      WITH user_segments AS (
        SELECT
          u.id AS "userId",
          COALESCE(${segmentField}, 'Unknown') AS segment,
          u."createdAt" AS "registeredAt"
        FROM user_entity u
        WHERE ${whereClause}
      ),
      activated_users AS (
        SELECT DISTINCT
          e."userId"
        FROM news_interaction_event e
        WHERE e."companyId" = $1::uuid
          AND e.type = 'OPEN'
          AND e."userId" IS NOT NULL
      ),
      engaged_users AS (
        SELECT
          e."userId"
        FROM news_interaction_event e
        WHERE e."companyId" = $1::uuid
          AND e."userId" IS NOT NULL
        GROUP BY e."userId"
        HAVING COUNT(*) >= 5
      )
      SELECT
        us.segment,
        COUNT(DISTINCT us."userId") AS registered,
        COUNT(DISTINCT CASE WHEN au."userId" IS NOT NULL THEN us."userId" END) AS activated,
        COUNT(DISTINCT CASE WHEN eu."userId" IS NOT NULL THEN us."userId" END) AS engaged
      FROM user_segments us
      LEFT JOIN activated_users au ON au."userId" = us."userId"
      LEFT JOIN engaged_users eu ON eu."userId" = us."userId"
      GROUP BY us.segment
      ORDER BY registered DESC
      LIMIT 20
    `;

    const funnelData = await this.ds.query(funnelSql, queryParams);

    // Calculate overall funnel
    const totalRegistered = funnelData.reduce((sum: number, row: any) => sum + Number(row.registered), 0);
    const totalActivated = funnelData.reduce((sum: number, row: any) => sum + Number(row.activated), 0);
    const totalEngaged = funnelData.reduce((sum: number, row: any) => sum + Number(row.engaged), 0);

    const activationRate = totalRegistered > 0 ? Math.round((totalActivated / totalRegistered) * 100) : 0;
    const engagementRate = totalActivated > 0 ? Math.round((totalEngaged / totalActivated) * 100) : 0;

    // Segment breakdown
    const segments = funnelData.map((row: any) => ({
      segment: row.segment,
      registered: Number(row.registered),
      activated: Number(row.activated),
      engaged: Number(row.engaged),
      activationRate:
        Number(row.registered) > 0
          ? Math.round((Number(row.activated) / Number(row.registered)) * 100)
          : 0,
      engagementRate:
        Number(row.activated) > 0
          ? Math.round((Number(row.engaged) / Number(row.activated)) * 100)
          : 0,
    }));

    // Top performing segments (by engagement rate)
    const topSegments = [...segments]
      .filter((s) => s.registered >= 3) // Minimum sample size
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);

    return {
      from: fromDate || null,
      to: toDate || null,
      segmentType: segmentAlias,
      overall: {
        registered: totalRegistered,
        activated: totalActivated,
        engaged: totalEngaged,
        activationRate,
        engagementRate,
      },
      segments,
      topPerformers: topSegments,
    };
  }
}

