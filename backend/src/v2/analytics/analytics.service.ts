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
    };
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

    // 3. Daily Series
    let activitySeries: any[] = [];
    try {
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
      activitySeries = await this.ds.query(sqlDaily, paramsPeriod);
    } catch (e) {
      // ignore
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

    const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const engagedRate = activeUsers > 0 ? Math.round((engagedUsers / activeUsers) * 100) : 0;

    return {
      users: {
        total: totalUsers,
        registered: totalUsers, // Assuming registered = total for now
        active: activeUsers,
        engaged: engagedUsers,
        activeRate,
        engagedRate
      },
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
  async searchOverview(companyId: string, params: any) {
    return {};
  }
}
